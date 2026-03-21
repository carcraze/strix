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
):
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

        # 1. Build instruction string from all context
        instruction_parts = []
        if context:
            instruction_parts.append(context)
        if credentials:
            cred_str = ", ".join(f"{c['username']}:{c['password']}" for c in credentials)
            instruction_parts.append(f"Test authenticated flows using: {cred_str}")
        if custom_headers:
            header_str = "; ".join(f"{h['name']}: {h['value']}" for h in custom_headers)
            instruction_parts.append(f"Include these headers: {header_str}")

        instruction = ". ".join(instruction_parts)

        # 2. Build target info list in the exact format StrixAgent expects
        targets_info = []
        for d in domains:
            url = f"https://{d}" if not d.startswith("http") else d
            targets_info.append({
                "type": "web_application",
                "details": {"target_url": url},
            })
        if config.allow_repos:
            for r in repos:
                repo_url = f"https://github.com/{r}" if not r.startswith("http") else r
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
        llm_config = LLMConfig(scan_mode=scan_mode)
        agent_config = {
            "llm_config": llm_config,
            "max_iterations": 300,
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

    # ── COMPLETE ─────────────────────────────────────────────────
    supabase_admin.table("pentests").update({
        "status": "completed",
        "completed_at": "now()",
        "report_url": report_url,
    }).eq("id", pentest_id).execute()

    publish_event(redis_channel, "status", {
        "status": "completed",
        "message": f"Scan complete — {len(findings)} finding{'s' if len(findings) != 1 else ''} discovered.",
        "findings_count": len(findings),
        "report_url": report_url,
    })


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
