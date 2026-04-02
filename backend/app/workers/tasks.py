import logging
import asyncio
import datetime
from celery import Celery  # type: ignore
from app.services.redis_service import publish_event  # type: ignore
from app.services.supabase import supabase_admin  # type: ignore
from app.core.scan_types import ScanType, SCAN_CONFIGS  # type: ignore
from app.core.config import settings  # type: ignore
from app.workers.pr_task import run_pr_review_task  # type: ignore

celery_app = Celery(
    "zentinel",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

# Explicitly enforce JSON serialization for all tasks.
# This ensures the large strix_instruction strings (with Unicode, newlines, special chars)
# are safely serialized to/from the Redis broker without corruption or pickle security risks.
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    task_always_eager=False,
    worker_prefetch_multiplier=1,  # one task at a time per worker — prevents memory spikes

    # GAP 4: Per-queue concurrency limits via routing.
    # day_zero scans are memory-heavy (clone + 5 parallel tools + AI triage).
    # We give day_zero its own queue and cap it at 2 concurrent scans so that
    # a HN traffic spike (50 founders signing up at once) cannot OOM the VM.
    # Pentest scans run on the separate 'scans' queue with concurrency=2.
    # The Redis queue absorbs the spike — tasks wait, not crash.
    task_routes={
        "run_day_zero_scan": {"queue": "day_zero"},  # separate low-concurrency queue
        "run_pentest":       {"queue": "scans"},
    },
)


class StrixLogHandler(logging.Handler):
    """Intercepts strix internal logs and pipes them to Redis for live streaming"""

    def __init__(self, pentest_id: str, redis_channel: str):
        super().__init__()
        self.pentest_id = pentest_id
        self.redis_channel = redis_channel

    def emit(self, record: logging.LogRecord):
        msg = self.format(record)
        publish_event(self.redis_channel, "log", {
            "scan_id": self.pentest_id,
            "message": msg,
            "type": _classify_log(msg),
            "timestamp": record.created,
        })


def _classify_log(message: str) -> str:
    msg = message.lower()
    if any(k in msg for k in ["thinking", "reasoning", "considering", "analyzing", "planning"]):
        return "thought"
    if any(k in msg for k in ["testing", "attempting", "sending", "requesting", "trying", "injecting", "probing"]):
        return "action"
    if any(k in msg for k in ["found", "vulnerable", "critical", "high severity", "confirmed", "exploit", "poc"]):
        return "finding"
    if any(k in msg for k in ["error", "failed", "exception", "timeout", "refused"]):
        return "error"
    return "info"


@celery_app.task(bind=True, name="run_pentest", max_retries=0)
def run_pentest_task(
    self,
    pentest_id: str,
    org_id: str,
    scan_type: str,
    domains: list[str],
    repos: list[str],
    context: str,
    credentials: list[dict],
    custom_headers: list[dict],
    credit_source: str,
    compliance_framework: str | None,
    generate_pdf: bool,
    scan_mode: str,
    strix_instruction: str | None = None,  # rich pre-built instruction from frontend
):
    import time as _time
    _scan_start = _time.time()

    redis_channel = f"pentest:{pentest_id}:logs"
    config = SCAN_CONFIGS[ScanType(scan_type)]

    supabase_admin.table("pentests").update({
        "status": "running",
        "started_at": "now()",
    }).eq("id", pentest_id).execute()

    publish_event(redis_channel, "status", {"status": "running", "message": "Scan started"})

    # Attach log interceptor to strix logger
    log_handler = StrixLogHandler(pentest_id, redis_channel)
    log_handler.setLevel(logging.DEBUG)
    strix_logger = logging.getLogger("strix")
    strix_logger.addHandler(log_handler)
    strix_logger.setLevel(logging.DEBUG)

    findings = []
    final_report_markdown = None

    try:
        # ── DIRECT EXECUTOR INVOCATION ────────────────────────────
        from strix.agents.StrixAgent import StrixAgent  # type: ignore
        from strix.llm.config import LLMConfig  # type: ignore
        from strix.telemetry.tracer import Tracer, set_global_tracer  # type: ignore

        # 1. Build the final instruction for Strix.
        #
        # Priority order:
        #   a) strix_instruction — rich, tier-specific prompt built by the frontend API
        #      (includes scan methodology, all user context, compliance framework etc.)
        #   b) Fallback — built here from the raw context fields when strix_instruction
        #      is absent (e.g. called directly via the backend API without the frontend)
        #
        # Even with ZERO user-provided context (just a domain), the agent runs a full
        # OSINT + blackbox security assessment using publicly available information.
        # The instruction below ensures productive output regardless of input richness.

        if strix_instruction:
            # Use the pre-built rich instruction from the frontend — includes all context,
            # tier-appropriate methodology, and compliance mapping
            instruction = strix_instruction
        else:
            # Fallback: build from raw context fields
            # This path is taken when called directly via backend API (no frontend)
            parts = []
            if context:
                parts.append(context)
            if compliance_framework:
                parts.append(f"Map all findings to {compliance_framework.upper()} controls.")
            if credentials:
                cred_str = " | ".join(
                    f"{c.get('username','user')}:{c.get('password','')} ({c.get('notes','')})"
                    for c in credentials
                )
                parts.append(f"Test authenticated flows using these credentials: {cred_str}")
            if custom_headers:
                header_str = "; ".join(
                    f"{h.get('name', h.get('key',''))}: {h.get('value','')}"
                    for h in custom_headers
                )
                parts.append(f"Include these headers in all requests: {header_str}")
            instruction = ". ".join(parts) if parts else ""

        # Ensure there's ALWAYS a base instruction even with zero user context.
        # A domain alone is enough — Strix will run OSINT + DAST from public surface.
        if not instruction.strip():
            instruction = _build_minimal_instruction(scan_type, domains, repos)

        # For deep/full_stack scans: prepend multi-agent orchestration directive.
        # The root agent has sub-agent delegation capability — use it to run phases in parallel.
        if scan_type in ("full_stack", "deep", "compliance"):
            orchestration_prefix = """You are the ROOT SECURITY ORCHESTRATOR for this engagement.
You MUST delegate specialized work to sub-agents. Do not do everything yourself sequentially.

DELEGATION STRATEGY:
1. Spawn a RECON sub-agent first: enumerate subdomains, map attack surface, identify all endpoints and technologies.
2. Spawn a SAST sub-agent (if repo provided): clone repo, analyze source code for CWE vulnerabilities, secrets, injection sinks.
3. Spawn an AUTH sub-agent: use provided credentials/headers to authenticate and test session management, JWT, privilege escalation.
4. Spawn an API FUZZER sub-agent: test every discovered/listed API endpoint for IDOR, SQLi, mass assignment, auth bypass.
5. Spawn a DEPENDENCY sub-agent (if repo provided): scan all package manifests for CVEs with reachability analysis.
6. Collect all sub-agent reports and compile the final finding list.

Each sub-agent should focus ONLY on its domain. This parallel approach covers more ground and produces higher-quality findings.
Do not call finish_scan until all sub-agents have reported back.

"""
            instruction = orchestration_prefix + instruction

        # ── STRIX INITIALIZATION BROADCAST ───────────────────────────────────
        # Emit the boot message to the live scan log stream (visible on the UI).
        # This confirms the tier, targets, and first phase to the user watching live.
        _tier_labels = {
            "quick":       ("Quick Scan ($49)",       "Phase 1 — OSINT Reconnaissance"),
            "web_api":     ("Web & API Scan ($99)",   "Phase 1 — OSINT Reconnaissance & Auth Surface Mapping"),
            "full_stack":  ("Full Stack Scan ($199)", "Phase 1 — Source Code Analysis (SAST)"),
            "compliance":  ("Compliance Scan ($299)", "Phase 1 — Full Stack Assessment with Compliance Mapping"),
            "deep":        ("Deep Scan (Subscription)","Phase 1 — Maximum Coverage Assessment"),
        }
        tier_label, first_phase = _tier_labels.get(scan_type, ("Security Scan", "Phase 1 — Reconnaissance"))
        target_summary = ", ".join(domains[:3]) + (f" +{len(domains)-3} more" if len(domains) > 3 else "")
        if repos:
            target_summary += f" | {len(repos)} repo(s)"

        _tier_personas = {
            "quick":      ["Web App Penetration Tester", "Security Report Writer"],
            "web_api":    ["Web App Penetration Tester", "Auth Bypass Specialist", "API Security Auditor", "Report Writer"],
            "full_stack": ["Web App Pen Tester", "Auth Bypass", "API Auditor", "SAST Reviewer", "Dependency Auditor", "CVE Assessor", "Report Writer"],
            "compliance": ["Web App Pen Tester", "Auth Bypass", "API Auditor", "SAST Reviewer", "Dependency Auditor", "CVE Assessor", "Threat Model Builder", "Report Writer"],
            "deep":       ["All Specialists", "Attack Path Analyst", "Crypto Analyst", "Supply Chain Auditor"],
        }
        personas_loaded = " | ".join(_tier_personas.get(scan_type, ["Web App Pen Tester"]))

        boot_lines = [
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            f"  ZENTINEL ENGINE 2.0 ONLINE",
            f"  Tier     : {tier_label}",
            f"  Target(s): {target_summary}",
            f"  Mode     : {scan_mode.upper()} | Context: {'Full' if context or strix_instruction else 'Minimal — running autonomous OSINT'}",
            f"  Personas : {personas_loaded}",
            f"  Starting : {first_phase}",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        ]
        for line in boot_lines:
            publish_event(redis_channel, "log", {
                "scan_id": pentest_id,
                "message": line,
                "type": "info",
                "timestamp": __import__("time").time(),
            })

        # 2. Build target info list in the exact format StrixAgent expects
        targets_info = []
        for d in domains:
            url = f"https://{d}" if not d.startswith("http") else d
            targets_info.append({
                "type": "web_application",
                "details": {"target_url": url},
            })

        # BUG FIX: Private repos require an OAuth token to clone.
        # Look up the GitHub/GitLab integration token for this org so the agent can clone private repos.
        # Without this, private repo clones fail silently and the agent skips source code analysis.
        # ── GAP 6: Tokens are stored encrypted in Supabase Vault ─────────────
        # Never read access_token directly (it is now NULL after migration).
        # Use the get_integration_token() RPC which decrypts via vault internally.
        _repo_token_cache: dict = {}
        def _get_repo_token(provider: str) -> str:
            if provider not in _repo_token_cache:
                try:
                    result = supabase_admin.rpc(
                        "get_integration_token",
                        {"p_org_id": org_id, "p_provider": provider},
                    ).execute()
                    _repo_token_cache[provider] = result.data or ""
                except Exception as e:
                    print(f"[Worker] Failed to read vault token for {provider}: {e}")
                    _repo_token_cache[provider] = ""
            return _repo_token_cache[provider]

        if config.allow_repos:
            for r in repos:
                # Detect provider and inject OAuth token for private repo access
                if "gitlab.com" in (r or ""):
                    provider = "gitlab"
                    token = _get_repo_token(provider)
                    repo_url = f"https://oauth2:{token}@gitlab.com/{r.replace('https://gitlab.com/', '')}" if token else r
                elif "bitbucket.org" in (r or ""):
                    provider = "bitbucket"
                    token = _get_repo_token(provider)
                    repo_url = f"https://x-token-auth:{token}@bitbucket.org/{r.replace('https://bitbucket.org/', '')}" if token else r
                else:
                    # Default: GitHub
                    provider = "github"
                    token = _get_repo_token(provider)
                    base = r if r.startswith("http") else f"https://github.com/{r}"
                    repo_url = base.replace("https://", f"https://oauth2:{token}@") if token else base

                repo_target: dict = {  # type: ignore[annotation]
                    "type": "repository",
                    "details": {
                        "target_repo": repo_url,
                        "workspace_subdir": None,
                        "cloned_repo_path": None,
                    },
                }
                targets_info.append(repo_target)

        # 3. Formulate configs
        _depth_limits = {
            "quick":      150,
            "web_api":    250,
            "full_stack": 400,
            "compliance": 450,
            "deep":       500,
        }
        max_iters = _depth_limits.get(scan_type, 300)

        # Load tool skills based on scan type.
        # The sandbox already has these tools installed — skills tell the agent HOW to use them.
        # Previously zero tool skills were loaded — agent did everything manually with a browser.
        _base_tools = [
            "tooling/subfinder",   # Subdomain enumeration
            "tooling/naabu",       # Port discovery
            "tooling/httpx",       # HTTP probing + tech fingerprinting
            "tooling/katana",      # Web crawling + endpoint discovery
            "tooling/nuclei",      # CVE/vulnerability templates (DAST #2)
            "tooling/ffuf",        # API fuzzing + directory brute-force
            "tooling/nmap",        # Service/port scanning
        ]
        _sast_tools = [
            "tooling/semgrep",      # AST-based SAST — all languages (Feature #1)
            "tooling/sqlmap",       # SQL injection automation (Feature #2)
            "tooling/trufflehog",   # Secrets detection — 800+ detectors, git history (Feature #9)
            "tooling/osv_scanner",  # SCA — CVEs with CVSS + reachability (Feature #3)
            "tooling/trivy",        # Container security + IaC + filesystem CVEs (Features #4, #5)
            "tooling/checkov",      # IaC misconfigs — Terraform/K8s/CloudFormation (Feature #5)
        ]
        _vuln_skills = [
            "vulnerabilities/sql_injection",
            "vulnerabilities/xss",
            "vulnerabilities/ssrf",
            "vulnerabilities/idor",
            "vulnerabilities/authentication_jwt",
            "vulnerabilities/mass_assignment",
            "vulnerabilities/business_logic",
            "vulnerabilities/race_conditions",
        ]

        if scan_type == "quick":
            skill_list = _base_tools[:4]  # lighter toolset for quick
        elif scan_type == "web_api":
            skill_list = _base_tools + _vuln_skills
        elif scan_type in ("full_stack", "compliance", "deep"):
            skill_list = _base_tools + _sast_tools + _vuln_skills
        else:
            skill_list = _base_tools

        llm_config = LLMConfig(scan_mode=scan_mode, skills=skill_list)
        agent_config = {
            "llm_config": llm_config,
            "max_iterations": max_iters,
            "non_interactive": True,
        }
        scan_config = {
            "scan_id": pentest_id,
            "targets": targets_info,
            "user_instructions": instruction,
            "run_name": pentest_id,  # Tracer saves outputs to strix_runs/<run_name>
        }

        # 4. Setup telemetry and bind Redis stream callback
        tracer = Tracer(pentest_id)
        tracer.set_scan_config(scan_config)

        def redis_finding_callback(report: dict):
            publish_event(redis_channel, "finding", {
                "title": report.get("title"),
                "severity": report.get("severity"),
                "description": report.get("description"),
            })

        tracer.vulnerability_found_callback = redis_finding_callback
        set_global_tracer(tracer)

        # 5. Execute synchronously inside the Celery worker
        agent = StrixAgent(agent_config)
        
        strix_logger.info(f"[ZENTINEL] About to call StrixAgent.execute_scan for pentest {pentest_id}")
        # Async run wrapper
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(agent.execute_scan(scan_config))
        finally:
            loop.close()
            
        res_str = str(result)
        strix_logger.info(f'[ZENTINEL] execute_scan returned: {type(result)} — {"{:.200s}".format(res_str)}')
        
        findings = tracer.vulnerability_reports
        final_report_markdown = tracer.final_scan_result

    except Exception as e:
        publish_event(redis_channel, "error", {"message": str(e)})
        supabase_admin.table("pentests").update({"status": "failed"}).eq("id", pentest_id).execute()

        # ── CRITICAL: RESTORE CREDIT ON FAILURE ─────────────────
        # User's money is protected — they can retry without repaying
        if credit_source == "one_time":
            supabase_admin.rpc("increment_scan_credit", {
                "org_id": org_id,
                "credit_type": scan_type,
                "amount": 1,
            }).execute()
            publish_event(redis_channel, "status", {
                "status": "failed",
                "message": "Scan failed. Your credit has been restored — you can retry.",
            })
        else:
            publish_event(redis_channel, "status", {
                "status": "failed",
                "message": "Scan failed. This scan has not counted against your monthly limit.",
            })
            # Also decrement the usage counter back for subscription scans
            current_month = datetime.datetime.now().strftime("%Y-%m")
            supabase_admin.rpc("decrement_scan_usage_on_failure", {
                "org_id": org_id,
                "month": current_month,
            }).execute()
        return

    finally:
        strix_logger.removeHandler(log_handler)

    # ── SAVE FINDINGS AS ISSUES ──────────────────────────────────
    if findings:
        issue_rows = [{
            "organization_id": org_id,
            "pentest_id": pentest_id,
            "title": f.get("title"),
            "description": f.get("description"),
            "severity": _normalize_severity(f.get("severity")),
            "status": "open",
            "poc_request":         f.get("poc_description"),
            "poc_response":        f.get("poc_script_code"),
            "fix_description":     f.get("remediation_steps"),
            "auto_fix_available":  False,  # Can determine this later based on templates
        } for f in findings]
        supabase_admin.table("issues").insert(issue_rows).execute()

    # ── PDF REPORT ───────────────────────────────────────────────
    report_url = None
    if generate_pdf and final_report_markdown:
        try:
            report_url = _generate_and_upload_report(
                pentest_id=pentest_id,
                final_markdown=final_report_markdown,
                compliance_framework=compliance_framework,
            )
        except Exception as e:
            publish_event(redis_channel, "log", {"type": "error", "message": f"Report generation failed: {e}"})

    # ── Read final report from disk ──────────────────────────────
    import os as _os
    run_dir = f"/home/alvin/zentinel/strix_runs/{pentest_id}"
    report_path = f"{run_dir}/penetration_test_report.md"
    final_report_text = None
    if _os.path.exists(report_path):
        try:
            with open(report_path, "r") as _f:
                final_report_text = _f.read()
        except Exception:
            pass

    # ── COMPLETE ─────────────────────────────────────────────────
    duration_secs = int(_time.time() - _scan_start)
    update_payload: dict = {
        "status": "completed",
        "completed_at": "now()",
        "report_url": report_url,
        "issues_found": len(findings),
        "duration_seconds": duration_secs,
    }
    if final_report_text:
        update_payload["final_report"] = final_report_text[:100000]  # cap at 100k chars

    supabase_admin.table("pentests").update(update_payload).eq("id", pentest_id).execute()

    publish_event(redis_channel, "status", {
        "status": "completed",
        "message": f"Scan complete — {len(findings)} finding{'s' if len(findings) != 1 else ''} discovered.",
        "findings_count": len(findings),
        "report_url": report_url,
    })

    # ── Email notification ────────────────────────────────────────────────────
    # Notify org members based on their notification_preferences settings
    _notify_url = __import__("os").environ.get("FRONTEND_URL", "https://app.zentinel.dev")
    _notify_secret = __import__("os").environ.get("NOTIFY_SECRET", "")
    if _notify_secret:
        try:
            import httpx as _httpx
            _httpx.post(
                f"{_notify_url}/api/notify/scan-complete",
                json={"pentest_id": pentest_id},
                headers={"x-notify-secret": _notify_secret},
                timeout=10,
            )
        except Exception as _e:
            pass  # Non-fatal — scan still succeeded


def _build_minimal_instruction(scan_type: str, domains: list[str], repos: list[str]) -> str:
    """
    Generates a comprehensive, productive scan instruction when the user provides
    no context at all — just a domain. The agent can still conduct a full OSINT +
    blackbox assessment from publicly available information.

    This ensures every scan delivers value regardless of how much context was provided.
    """
    targets = ", ".join(domains) if domains else "the target"
    has_repo = bool(repos)

    base = f"""You are an elite autonomous security engineer conducting a professional penetration test against: {targets}.

PHASE 1 — RECONNAISSANCE & OSINT
- Enumerate all subdomains, open ports, and exposed services using passive and active techniques.
- Identify the technology stack (frameworks, CDN, WAF, server, CMS) from HTTP headers, error pages, robots.txt, and sitemap.xml.
- Discover all exposed API endpoints, admin panels, login pages, and documentation (Swagger, OpenAPI, GraphQL introspection).
- Check for exposed .git directories, .env files, backup files (.bak, .sql, .zip), and debug endpoints.
- Search for exposed credentials, API keys, and secrets in public sources (GitHub, Shodan, Wayback Machine).

PHASE 2 — VULNERABILITY ASSESSMENT (DAST)
- Test every discovered endpoint for OWASP Top 10 vulnerabilities:
  A01: Broken Access Control — test IDOR, horizontal/vertical privilege escalation, forced browsing
  A02: Cryptographic Failures — weak TLS, sensitive data in transit/at rest, insecure cookies
  A03: Injection — SQL, NoSQL, LDAP, OS command, SSTI injection in all input fields
  A04: Insecure Design — business logic flaws, race conditions, workflow bypasses
  A05: Security Misconfiguration — default credentials, verbose errors, directory listing, CORS
  A06: Vulnerable Components — check all detected libraries/dependencies against CVE databases
  A07: Authentication Failures — brute force, credential stuffing, session fixation, JWT attacks
  A08: Software & Data Integrity — check for deserialization, supply chain issues
  A09: Logging Failures — test if attacks are logged and alerted on
  A10: SSRF — test all URL parameters and file upload endpoints
- Actively exploit confirmed vulnerabilities to generate proof-of-concept payloads.
- Test for API-specific attacks: mass assignment, object-level authorization, rate limiting bypass.

PHASE 3 — DEPENDENCY & SCA ANALYSIS"""

    if has_repo:
        base += """
- Scan all package manifests (package.json, requirements.txt, go.mod, pom.xml, Gemfile) for vulnerable dependencies.
- Run reachability analysis — only flag CVEs in code paths that are actually called.
- Check for hardcoded secrets, API keys, and credentials in source code.
- Identify injection sinks, unsafe deserialisation, and dangerous function calls (eval, exec, system).
- Review authentication and authorisation logic for logic flaws.
- Check Infrastructure-as-Code files (Terraform, CloudFormation, Kubernetes YAML) for misconfigurations."""
    else:
        base += """
- Identify all client-side JavaScript files and extract API endpoints, tokens, and secrets.
- Check for exposed source maps (.map files) that reveal original source code.
- Test for client-side vulnerabilities: XSS, DOM clobbering, prototype pollution."""

    base += """

PHASE 4 — REPORTING
For each vulnerability found, provide:
- FINDING_N with Severity: CRITICAL | HIGH | MEDIUM | LOW
- CVSS Score (calculate accurately)
- OWASP Category mapping
- File or endpoint location
- Precise Proof of Concept (working curl command, script, or payload)
- Exact remediation code or configuration fix
- Compliance impact (SOC 2 CC, ISO 27001 controls)

Report ONLY real, exploitable, verified vulnerabilities with working PoCs.
Zero tolerance for false positives — if you cannot prove it with a PoC, do not report it.
If the target is fully secure, state: PASSED — with a one-sentence explanation."""

    return base


@celery_app.task(bind=True, name="run_day_zero_scan", max_retries=0)
def run_day_zero_task(
    self,
    org_id: str,
    repo_id: str,
    repo_full_name: str,
    scan_run_id: str,
    github_token: str | None = None,
):
    """Day Zero onboarding scan — runs on the Celery worker, not Cloud Run.
    Parallel: SCA (Trivy/OSV) + SAST (Semgrep) + IaC (Checkov) + Secrets (TruffleHog) + License.
    After scanning: Claude Sonnet 4.6 via Vertex AI triages findings for false positives.
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        from app.services.day_zero_scanner import DayZeroScanner
        scanner = DayZeroScanner(
            org_id=org_id,
            repo_id=repo_id,
            repo_full_name=repo_full_name,
            github_token=github_token,
            scan_run_id=scan_run_id,
        )
        result = loop.run_until_complete(scanner.run_pipeline())
        logging.getLogger("zentinel").info(
            f"[DayZero] Completed scan_run {scan_run_id}: "
            f"{result.get('findings', 0)} findings, "
            f"{result.get('auto_ignored', 0)} auto-ignored"
        )
        return result
    except Exception as e:
        logging.getLogger("zentinel").error(f"[DayZero] Task failed for {repo_full_name}: {e}")
        supabase_admin.table("scan_runs").update({
            "status": "failed",
            "error_message": str(e)[:500],
        }).eq("id", scan_run_id).execute()
        raise
    finally:
        loop.close()


def _normalize_severity(raw: str) -> str:
    s = str(raw).lower()
    if s == "critical": return "critical"
    if s == "high": return "high"
    if s in ("medium", "moderate"): return "medium"
    return "low"


def _generate_and_upload_report(pentest_id: str, final_markdown: str, compliance_framework: str | None) -> str | None:
    """
    Generate PDF and upload to Supabase Storage.
    Use weasyprint or reportlab — implement based on your PDF template.
    Returns public URL string or None if failed.
    """
    # TODO: implement PDF generation
    return None
