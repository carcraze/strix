import asyncio
import httpx  # type: ignore
import json
import logging
import os
import re
import time
import csv
from celery import shared_task  # type: ignore
from celery.exceptions import SoftTimeLimitExceeded, Retry  # type: ignore
from app.services.supabase import supabase_admin  # type: ignore
from app.core.config import settings  # type: ignore
from app.services.redis_service import publish_event  # type: ignore

log = logging.getLogger(__name__)

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

# ─────────────────────────────────────────────────────────────────────────────
# Strix Prompt
# ─────────────────────────────────────────────────────────────────────────────
STRIX_PR_INSTRUCTION = """
You are an elite security engineer reviewing a pull request. You have access to the full repository, a live Docker sandbox, and a browser. Do not just read the diff — actively attack it.

PHASE 0 — SECRETS SCAN (run FIRST, before reading the diff)
Run TruffleHog on the repository immediately:
  trufflehog git file:///workspace --json --no-update 2>/dev/null
  trufflehog filesystem /workspace --json --no-update 2>/dev/null
Any secrets found are CRITICAL findings — report them immediately before proceeding.
Also run: grep -rE "(AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{48}|ghp_[a-zA-Z0-9]{36})" /workspace 2>/dev/null

PHASE 0.5 — SCA (run on new dependencies in the diff)
If package.json, requirements.txt, go.mod, or any manifest was modified:
  cd /workspace && npm audit --json 2>/dev/null
  osv-scanner --recursive /workspace --json 2>/dev/null
Report any HIGH/CRITICAL CVEs in new or updated dependencies with CVSS scores.

PHASE 1 — STATIC ANALYSIS (read the diff)
- New dependencies: check each against OSV, NVD, and Snyk databases
- Secrets and credentials in added lines (API keys, tokens, private keys, connection strings)
- Dangerous function calls (eval, exec, system, shell_exec)
- Clear SQL injection or command injection vectors
- Missing authorization checks on new routes
- Insecure direct object references (IDOR) on new parameters
- Undocumented or default environment variables introduced
- Race conditions in new async/threaded code
- Cryptographic issues (weak hashes, hardcoded salts, insecure randoms)

PHASE 2 — DYNAMIC VALIDATION (run it)
Spin up the application in the sandbox using the provided repository and branch.
- Run `npm audit` or equivalent dependency checker in the sandbox to get real CVEs, CVSS scores, and identify exact outdated packages.
- Send actual HTTP requests to new API endpoints
- Attempt authentication bypass on added features
- Upload malicious files if file upload logic was changed
- Fuzz any new input fields
- Test OAuth/session state manipulation if auth logic changed
- If background jobs are added, test deserialization attacks (if applicable)

PHASE 3 — DEPENDENCY EXPLOIT CHECK
- If a new dependency is added or flagged by `npm audit`, look for published exploit proofs-of-concept (PoCs).
- Map out the dependency chain to flag transitive dependencies with critical CVEs. Include exact CVSS scores.

PHASE 4 — BUSINESS LOGIC EVALUATOR
- Understand the intent of the PR. What is this feature trying to do?
- How could a legitimate user abuse this new workflow?
- If it's billing/payment code, test for price manipulation, quantity bypass, or race conditions.
- If it introduces admin features, check privilege escalation from standard users.

PHASE 5 — REPORT
Output your findings exactly like this. Do not hallucinate. Do not skip checking the dynamic sandbox. Ensure you inject the npm audit findings with CVSS scores directly into the report.

FINDING_1:
- Severity: CRITICAL | HIGH | MEDIUM | LOW
- CVSS Score: 0.0 - 10.0 (if applicable)
- OWASP Category: e.g., A01:2021-Broken Access Control
- File: path/to/file.py (Line X)
- Vulnerability: concise description (include CVE if known)
- Proof: curl command, python script that executes the attack, or npm audit output snippet
- Fix: Exact one-line code replacement or npm install command

If the PR is completely clean and secure, state: PASSED, with a 1-sentence explanation.
"""

STRIX_FULL_REPO_INSTRUCTION = """
You are an elite security engineer performing a comprehensive security review of a repository codebase. You have access to the full repository, a live Docker sandbox, and a browser. Do not just read the code — actively attack it.

PHASE 0 — SECRETS + SCA (run IMMEDIATELY before anything else)

Secrets Detection (TruffleHog — 800+ credential detectors):
  trufflehog git file:///workspace --json --no-update 2>/dev/null
  trufflehog filesystem /workspace --json --no-update 2>/dev/null
  # Fallback if TruffleHog not available:
  grep -rE "(AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{48}|ghp_[a-zA-Z0-9]{36}|xoxb-[0-9]+-[a-zA-Z0-9]+|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY)" /workspace 2>/dev/null
Any secrets found = CRITICAL finding. Report immediately with file path, line number, secret type.

Software Composition Analysis (OSV-Scanner + npm audit):
  osv-scanner --recursive /workspace --json 2>/dev/null
  cd /workspace && npm audit --json 2>/dev/null
  pip-audit -r /workspace/requirements.txt --format json 2>/dev/null
Report all HIGH/CRITICAL CVEs with CVSS scores, affected versions, and fixed versions.

SAST (Semgrep — AST-based, all languages):
  semgrep scan /workspace --config=auto --metrics=off --json 2>/dev/null
Report all HIGH/ERROR findings with file path and line number.

Only after Phase 0 is complete, proceed to dynamic testing:

PHASE 1 — STATIC ANALYSIS
- Scan the entire codebase for security anti-patterns, OWASP Top 10 vulnerabilities, and misconfigurations.
- Secrets and credentials (API keys, tokens, private keys, connection strings)
- Dangerous function calls (eval, exec, system, shell_exec)
- SQL injection or command injection vectors
- Missing authorization checks on routes
- Insecure direct object references (IDOR) on parameters
- Race conditions in async/threaded code
- Cryptographic issues (weak hashes, hardcoded salts, insecure randoms)

PHASE 2 — DYNAMIC VALIDATION (run it)
Spin up the application in the sandbox using the provided repository and branch.
- Run `npm audit` or equivalent dependency checker in the sandbox to get real CVEs, CVSS scores, and identify exact outdated packages.
- Send actual HTTP requests to API endpoints
- Attempt authentication bypass
- Upload malicious files
- Fuzz any input fields

PHASE 3 — DEPENDENCY EXPLOIT CHECK
- Look for published exploit proofs-of-concept (PoCs) for any outdated dependencies flagged by `npm audit`.
- Map out the dependency chain to flag transitive dependencies with critical CVEs. Include exact CVSS scores.

PHASE 4 — BUSINESS LOGIC EVALUATOR
- Understand the intent of the application.
- How could a legitimate user abuse workflows?
- Test for price manipulation, privilege escalation, etc.

PHASE 5 — REPORT
Output your findings exactly like this. Do not hallucinate. Do not skip checking the dynamic sandbox. Ensure you inject the npm audit findings with CVSS scores directly into the report.

FINDING_1:
- Severity: CRITICAL | HIGH | MEDIUM | LOW
- CVSS Score: 0.0 - 10.0 (if applicable)
- OWASP Category: e.g., A01:2021-Broken Access Control
- File: path/to/file.py (Line X)
- Vulnerability: concise description (include CVE if known)
- Proof: curl command, python script that executes the attack, or npm audit output snippet
- Fix: Exact one-line code replacement or npm install command

If the codebase is completely clean and secure, state: PASSED, with a 1-sentence explanation.
"""

# ─────────────────────────────────────────────────────────────────────────────
# Git Provider Adapter Pattern
# ─────────────────────────────────────────────────────────────────────────────
class GitProvider:
    """Base adapter interface for Git providers."""

    def get_diff(self, client: httpx.Client, pr_id: int) -> str:
        raise NotImplementedError

    def get_new_files(self, client: httpx.Client, pr_id: int) -> str:
        raise NotImplementedError

    def post_comment(self, client: httpx.Client, pr_id: int, body: str) -> None:
        raise NotImplementedError

    def set_commit_status(self, client: httpx.Client, sha: str, state: str, description: str) -> None:
        raise NotImplementedError


class GitHubAdapter(GitProvider):
    def __init__(self, token: str, repo_full_name: str):
        self.headers = {
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        self.repo = repo_full_name

    def get_diff(self, client: httpx.Client, pr_id: int) -> str:
        diff_headers = {**self.headers, "Accept": "application/vnd.github.v3.diff"}
        res = client.get(f"https://api.github.com/repos/{self.repo}/pulls/{pr_id}", headers=diff_headers)
        res.raise_for_status()
        return res.text

    def get_new_files(self, client: httpx.Client, pr_id: int) -> str:
        res = client.get(f"https://api.github.com/repos/{self.repo}/pulls/{pr_id}/files", headers=self.headers)
        res.raise_for_status()
        files = res.json()
        content = ""
        if isinstance(files, list):
            for f in files:
                if isinstance(f, dict):
                    if f.get("status") == "added" and f.get("raw_url"):
                        raw_url = str(f.get("raw_url"))
                        raw = client.get(raw_url, headers=self.headers)  # type: ignore
                        filename = str(f.get("filename", ""))
                        content += f"\n\n--- NEW FILE: {filename} ---\n{raw.text}\n"  # type: ignore
        return content

    def post_comment(self, client: httpx.Client, pr_id: int, body: str) -> None:
        url = f"https://api.github.com/repos/{self.repo}/issues/{pr_id}/comments"
        res = client.post(url, headers=self.headers, json={"body": body})
        if res.status_code >= 400:
            print("GitHub comment failed:", res.text)

    def set_commit_status(self, client: httpx.Client, sha: str, state: str, description: str) -> None:
        url = f"https://api.github.com/repos/{self.repo}/statuses/{sha}"
        desc_str = str(description)
        payload = {"state": state, "description": desc_str[:140], "context": "Zentinel Security Scanner"}  # type: ignore
        res = client.post(url, headers=self.headers, json=payload)
        if res.status_code >= 400:
            print("GitHub status failed:", res.text)


class GitLabAdapter(GitProvider):
    def __init__(self, token: str, project_id: str):
        self.headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        self.project_id = project_id
        self.base = "https://gitlab.com/api/v4"

    def get_diff(self, client: httpx.Client, pr_id: int) -> str:
        res = client.get(
            f"{self.base}/projects/{self.project_id}/merge_requests/{pr_id}/changes",
            headers=self.headers
        )
        res.raise_for_status()
        data = res.json()
        # Build unified diff text from changes array
        diff_text = ""
        if isinstance(data, dict):
            changes = data.get("changes", [])
            if isinstance(changes, list):
                for change in changes:
                    if isinstance(change, dict):
                        old_path = str(change.get("old_path", ""))
                        new_path = str(change.get("new_path", ""))
                        diff_text += f"\n--- a/{old_path}\n+++ b/{new_path}\n"  # type: ignore
                        diff_text += str(change.get("diff", ""))  # type: ignore
        return diff_text

    def get_new_files(self, client: httpx.Client, pr_id: int) -> str:
        res = client.get(
            f"{self.base}/projects/{self.project_id}/merge_requests/{pr_id}/changes",
            headers=self.headers
        )
        if not res.is_success:
            return ""
        data = res.json()
        content = ""
        if isinstance(data, dict):
            changes = data.get("changes", [])
            if isinstance(changes, list):
                for change in changes:
                    if isinstance(change, dict) and change.get("new_file"):
                        new_path = str(change.get("new_path", ""))
                        file_diff = str(change.get("diff", ""))
                        content += f"\n\n--- NEW FILE: {new_path} ---\n{file_diff}\n"  # type: ignore
        return content

    def post_comment(self, client: httpx.Client, pr_id: int, body: str) -> None:
        url = f"{self.base}/projects/{self.project_id}/merge_requests/{pr_id}/notes"
        res = client.post(url, headers=self.headers, json={"body": body})
        if res.status_code >= 400:
            print("GitLab comment failed:", res.text)

    def set_commit_status(self, client: httpx.Client, sha: str, state: str, description: str) -> None:
        # GitLab states: pending, running, success, failed, canceled
        gitlab_state = "failed" if state == "failure" else "success"
        url = f"{self.base}/projects/{self.project_id}/statuses/{sha}"
        desc_str = str(description)
        payload = {"state": gitlab_state, "description": desc_str[:140], "name": "Zentinel Security Scanner"}  # type: ignore
        res = client.post(url, headers=self.headers, json=payload)
        if res.status_code >= 400:
            print("GitLab status failed:", res.text)


class BitbucketAdapter(GitProvider):
    def __init__(self, token: str, repo_full_name: str):
        self.headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        self.base = "https://api.bitbucket.org/2.0"
        parts = repo_full_name.split("/")
        self.workspace = parts[0] if len(parts) >= 1 else ""
        self.slug = parts[1] if len(parts) >= 2 else ""

    def get_diff(self, client: httpx.Client, pr_id: int) -> str:
        res = client.get(
            f"{self.base}/repositories/{self.workspace}/{self.slug}/pullrequests/{pr_id}/diff",
            headers=self.headers
        )
        res.raise_for_status()
        return res.text

    def get_new_files(self, client: httpx.Client, pr_id: int) -> str:
        # Bitbucket diff endpoint returns unified diff — parse it for new files
        diff = self.get_diff(client, pr_id)
        new_files_content = ""
        lines = diff.split("\n")
        current_file = None
        is_new = False
        buffer: list[str] = []
        for line in lines:
            if line.startswith("--- /dev/null"):
                is_new = True
            elif line.startswith("+++ b/") and is_new:
                current_file = line[6:]  # type: ignore
                buffer = []
            elif current_file and is_new:
                if line.startswith("diff --git"):
                    # flush
                    new_files_content += f"\n\n--- NEW FILE: {str(current_file)} ---\n" + "\n".join(buffer)  # type: ignore
                    current_file = None
                    is_new = False
                    buffer = []
                else:
                    buffer.append(line)  # type: ignore
        if current_file and is_new and buffer:
            new_files_content += f"\n\n--- NEW FILE: {str(current_file)} ---\n" + "\n".join(buffer)  # type: ignore
        return new_files_content

    def post_comment(self, client: httpx.Client, pr_id: int, body: str) -> None:
        url = f"{self.base}/repositories/{self.workspace}/{self.slug}/pullrequests/{pr_id}/comments"
        res = client.post(url, headers=self.headers, json={"content": {"raw": body}})
        if res.status_code >= 400:
            print("Bitbucket comment failed:", res.text)

    def set_commit_status(self, client: httpx.Client, sha: str, state: str, description: str) -> None:
        # Bitbucket states: INPROGRESS, SUCCESSFUL, FAILED, STOPPED
        bb_state = "FAILED" if state == "failure" else "SUCCESSFUL"
        url = f"{self.base}/repositories/{self.workspace}/{self.slug}/commit/{sha}/statuses/build"
        desc_str = str(description)
        payload = {
            "key": "zentinel-security",
            "state": bb_state,
            "name": "Zentinel Security Scanner",
            "description": desc_str[:255],  # type: ignore
            "url": "https://app.zentinel.dev/dashboard/pr-reviews",
        }
        res = client.post(url, headers=self.headers, json=payload)
        if res.status_code >= 400:
            print("Bitbucket status failed:", res.text)


def get_adapter(provider: str, token: str, repo_full_name: str, provider_repo_id: str = "") -> GitProvider:
    if provider == "github":
        return GitHubAdapter(token, repo_full_name)
    if provider == "gitlab":
        return GitLabAdapter(token, provider_repo_id)
    if provider == "bitbucket":
        return BitbucketAdapter(token, repo_full_name)
    raise ValueError(f"Unknown provider: {provider}")


# ─────────────────────────────────────────────────────────────────────────────
# Comment Formatter
# ─────────────────────────────────────────────────────────────────────────────
def _format_comment(findings: list, final_report: str) -> str:
    if not findings:
        body = "### 🛡️ Zentinel Elite Security Analysis: **PASSED**\nNo security vulnerabilities were detected in this pull request.\n\n"
        if final_report:
            body += f"<details><summary>Analysis details</summary>\n\n{final_report}\n\n</details>"
        return body

    body = f"### ⚠️ Zentinel Elite Security Analysis: **{len(findings)} ISSUES FOUND**\n\n"
    body += "| Severity | Vulnerability | File |\n|----------|---------------|------|\n"
    for fw in findings:
        sev = fw.get("severity", "LOW").upper()
        sev_icon = "🔴" if sev == "CRITICAL" else "🟠" if sev == "HIGH" else "🟡" if sev == "MEDIUM" else "🔵"
        body += f"| {sev_icon} {sev} | {fw.get('title', 'Unknown')} | `{fw.get('file_path', 'N/A')}` |\n"

    body += "\n\n<details><summary>Detailed Reports & Proofs</summary>\n\n"
    for fw in findings:
        body += f"#### {fw.get('title')}\n"
        body += f"**Description**: {fw.get('description')}\n\n"
        body += f"**Proof / Payload**:\n```\n{fw.get('poc_description', 'N/A')}\n{fw.get('poc_script_code', '')}\n```\n\n"
        body += f"**Remediation**:\n{fw.get('remediation_steps', '')}\n\n---\n"
    body += "</details>"
    return body


# ─────────────────────────────────────────────────────────────────────────────
# Celery Task
# ─────────────────────────────────────────────────────────────────────────────
@shared_task(name="run_pr_review_task", bind=True, max_retries=1, soft_time_limit=5400, time_limit=7200)
def run_pr_review_task(
    self,
    org_id: str,
    repo_id: str,
    pr_review_id: str,
    repo_full_name: str,
    clone_url: str,
    pr_number: int,
    branch_name: str,
    commit_sha: str,
    block_merge_on_critical: bool,
    provider: str = "github",
    provider_repo_id: str = "",
    access_token: str = "",
    trigger: str = "manual",
):
    scan_start_time = time.time()
    redis_channel = f"pr_review:{pr_review_id}:logs"
    
    # Attach log interceptor to strix logger
    log_handler = StrixLogHandler(pr_review_id, redis_channel)
    log_handler.setLevel(logging.DEBUG)
    strix_logger = logging.getLogger("strix")
    strix_logger.addHandler(log_handler)
    strix_logger.setLevel(logging.DEBUG)
    
    try:
        publish_event(redis_channel, "status", {"status": "running", "message": "PR Scan started"})
        log.info(f"[ZENTINEL] Task started | pr_review_id={pr_review_id} repo={repo_full_name} trigger={trigger} provider={provider}")

        # 0. Validate PR Number (skip if full_repo)
        if trigger != "full_repo" and (not pr_number or int(pr_number) <= 0):
            error_msg = "Invalid PR number: must be a real open pull request number"
            supabase_admin.table("pr_reviews").update({
                "status": "failed",
                "completed_at": "now()",
                "diff_content": error_msg
            }).eq("id", pr_review_id).execute()
            log.error(f"[ZENTINEL] Validation failed: {error_msg}")
            return

        # 1. Get OAuth token (prefer token passed in payload, fallback to DB lookup)
        token = access_token
        if not token:
            log.info(f"[ZENTINEL] No access_token in payload — looking up from integrations table")
            integ = supabase_admin.table("integrations").select("access_token").eq("organization_id", org_id).eq("provider", provider).execute().data
            if not integ:
                raise Exception(f"{provider} integration not found for organization")
            token = integ[0]["access_token"]

        # 1b. Build authenticated clone URL for private repos
        # Inject OAuth token so Strix can clone private repos without interactive auth
        if token and clone_url:
            if provider == "github" and "github.com" in clone_url:
                auth_clone_url = clone_url.replace("https://", f"https://oauth2:{token}@")
            elif provider == "gitlab" and "gitlab.com" in clone_url:
                auth_clone_url = clone_url.replace("https://", f"https://oauth2:{token}@")
            elif provider == "bitbucket" and "bitbucket.org" in clone_url:
                auth_clone_url = clone_url.replace("https://", f"https://x-token-auth:{token}@")
            else:
                auth_clone_url = clone_url
        else:
            auth_clone_url = clone_url

        log.info(f"[ZENTINEL] Auth clone URL ready | provider={provider} private_auth=True")

        # 2. Build adapter
        adapter = get_adapter(provider, token, repo_full_name, provider_repo_id)

        with httpx.Client(timeout=60) as client:
            raw_diff = ""
            new_file_contents = ""

            if trigger != "full_repo":
                log.info(f"[ZENTINEL] Fetching PR diff | pr_number={pr_number}")
                raw_diff = adapter.get_diff(client, pr_number)
                log.info(f"[ZENTINEL] Diff fetched | chars={len(raw_diff)}")

                supabase_admin.table("pr_reviews").update({
                    "diff_content": raw_diff,
                    "status": "running"
                }).eq("id", pr_review_id).execute()

                new_file_contents = adapter.get_new_files(client, pr_number)
            else:
                raw_diff = "Full Repository Scan Initiated"
                supabase_admin.table("pr_reviews").update({
                    "diff_content": raw_diff,
                    "status": "running"
                }).eq("id", pr_review_id).execute()

        # 6. Construct Agent Instruction
        from strix.agents.StrixAgent import StrixAgent  # type: ignore
        from strix.llm.config import LLMConfig  # type: ignore
        from strix.telemetry.tracer import Tracer, set_global_tracer  # type: ignore

        if trigger == "full_repo":
            full_instruction = STRIX_FULL_REPO_INSTRUCTION
            targets = [auth_clone_url]
        else:
            full_instruction = STRIX_PR_INSTRUCTION + "\n\n=== PR RAW DIFF ===\n" + raw_diff
            if new_file_contents:
                full_instruction += "\n\n=== NEW FILES ADDED FULL CONTEXT ===\n" + new_file_contents
            # StrixAgent needs standard targets (like 'repository') to function correctly.
            # Passing raw text doesn't configure its workspace. We pass auth_clone_url for both!
            targets = [auth_clone_url]

        targets_info = []
        for t in targets:
            targets_info.append({
                'type': 'repository',
                'details': {
                    'target_repo': t,
                    'workspace_subdir': None,
                    'cloned_repo_path': None,
                }
            })

        log.info(f'[ZENTINEL] targets_info: {targets_info}')

        # 7. Call Strix
        # Load tool skills for PR reviews — secrets + SCA run on every PR
        # This makes PR reviews catch leaked credentials and vulnerable deps instantly
        pr_skills = [
            "tooling/trufflehog",   # Secrets in new code + git history (CRITICAL for PRs)
            "tooling/semgrep",      # SAST on changed files
            "tooling/osv_scanner",  # New dependencies introduced in this PR
            "tooling/httpx",        # Test new API endpoints added in the diff
            "tooling/nuclei",       # CVE checks on new endpoints
            "vulnerabilities/authentication_jwt",
            "vulnerabilities/idor",
            "vulnerabilities/sql_injection",
            "vulnerabilities/xss",
            "vulnerabilities/mass_assignment",
        ]
        agent_config = {"llm_config": LLMConfig(scan_mode="deep", skills=pr_skills), "max_iterations": 200, "non_interactive": True}
        scan_config = {
            'scan_id': f'pr_{pr_review_id}',
            'targets': targets_info,
            'user_instructions': full_instruction,
            'run_name': f'pr_{pr_review_id}',
        }

        tracer = Tracer(f"pr_{pr_review_id}")
        tracer.set_scan_config(scan_config)
        set_global_tracer(tracer)

        log.info(f'[ZENTINEL] scan_config: {json.dumps(scan_config, default=str)}')
        log.info(f"[ZENTINEL] Starting StrixAgent.execute_scan | repo={repo_full_name} trigger={trigger} branch={branch_name}")
        log.info(f"[ZENTINEL] About to call StrixAgent.execute_scan")

        agent = StrixAgent(agent_config)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(agent.execute_scan(scan_config))
        finally:
            loop.close()

        res_str = str(result)
        log.info(f'[ZENTINEL] execute_scan returned: {type(result)} — {"{:.200s}".format(res_str)}')

        if isinstance(result, dict) and not result.get("success", True):
            error_msg = result.get("error", "Unknown Zentinel engine error")
            err_lower = error_msg.lower()
            
            if "429" in err_lower or "quota" in err_lower or "resource" in err_lower and "exhausted" in err_lower or "too many requests" in err_lower:
                log.warning(f"[ZENTINEL] 429 Rate Limit caught during execute_scan. Retrying Celery task. Error: {error_msg}")
                raise self.retry(exc=Exception(error_msg), countdown=180, max_retries=4)

            log.error(f"[ZENTINEL] execute_scan failed: {error_msg}")
            supabase_admin.table("pr_reviews").update({
                "status": "failed",
                "completed_at": "now()",
                "final_report": f"Scan failed to complete due to an internal execution error: {error_msg}"
            }).eq("id", pr_review_id).execute()
            return

        run_dir = f"/home/alvin/zentinel/strix_runs/pr_{pr_review_id}"
        csv_path = f"{run_dir}/vulnerabilities.csv"
        findings = []

        if os.path.exists(csv_path):
            log.info(f"[ZENTINEL] Reading findings from {csv_path}")
            with open(csv_path, "r") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    vuln_path = f'{run_dir}/{row["file"]}'
                    vuln_content = ''
                    if os.path.exists(vuln_path):
                        with open(vuln_path, "r") as vf:
                            vuln_content = vf.read()
                    
                    findings.append({
                        "id": row.get("id", ""),
                        "title": row.get("title", ""),
                        "severity": row.get("severity", "medium").lower(),
                        "timestamp": row.get("timestamp", ""),
                        "content": vuln_content,
                        "description": vuln_content[:2000] if vuln_content else row.get("title", ""),  # type: ignore[index]
                        "file_path": row.get("file", ""),
                        "poc_description": "",
                        "poc_script_code": "",
                    })
            log.info(f"[ZENTINEL] Found {len(findings)} findings from file {csv_path}")
        else:
            log.warning(f"[ZENTINEL] {csv_path} not found, using tracer fallback")
            findings = list(tracer.vulnerability_reports or [])

        final_report = tracer.final_scan_result
        scan_duration_s = int(time.time() - scan_start_time)

        # ── Read Strix report file (primary source of truth) ──────────────────
        report_path = f"{run_dir}/penetration_test_report.md"
        report_content = None
        if os.path.exists(report_path):
            with open(report_path, "r") as _rf:
                report_content = _rf.read()
            log.info(f"[ZENTINEL] Report file found | path={report_path} length={len(report_content)}")
            final_report = report_content  # file overrides tracer
        else:
            log.warning(f"[ZENTINEL] Report file NOT found at {report_path} — using tracer data")

        log.info(f"[ZENTINEL] Scan complete | findings_from_tracer={len(findings)} duration={scan_duration_s}s")

        if not findings:
            log.warning(f"[ZENTINEL] Zero findings from tracer | final_report_length={len(final_report or '')}")

        # 8. Count by severity
        critical_count = sum(1 for f in findings if f.get("severity", "").lower() == "critical")
        high_count = sum(1 for f in findings if f.get("severity", "").lower() == "high")
        medium_count = sum(1 for f in findings if f.get("severity", "").lower() == "medium")

        # 9. Post comment/status (PR scans → comment; full_repo → commit status always)
        if trigger != "full_repo":
            comment_body = _format_comment(findings, final_report)
            with httpx.Client(timeout=30) as client:
                adapter.post_comment(client, pr_number, comment_body)

                if block_merge_on_critical and commit_sha:
                    status_state = "failure" if critical_count > 0 else "success"
                    status_desc = (
                        f"{critical_count} critical issues found by Zentinel." if critical_count > 0
                        else "Zentinel security checks passed."
                    )
                    adapter.set_commit_status(client, commit_sha, status_state, status_desc)
        else:
            # Full repo scans: parse FINDING blocks from report file into issues table
            parsed_findings = []
            if report_content:
                pattern = (
                    r"FINDING_(\d+):\n- Severity:\s*(\w+)\n"
                    r"(?:- CVSS Score:[^\n]*\n)?"
                    r"(?:- OWASP Category:[^\n]*\n)?"
                    r"- File:\s*(.+?)\n"
                    r"- Vulnerability:\s*(.+?)\n- Proof:(.*?)\n- Fix:(.*?)(?=\nFINDING_|\n#|\Z)"
                )
                for m in re.finditer(pattern, report_content, re.DOTALL):
                    parsed_findings.append({
                        "severity": m.group(2).strip().lower(),
                        "file_path": m.group(3).strip(),
                        "title": str(m.group(4).strip())[:255],  # type: ignore[index]
                        "poc_description": m.group(5).strip(),
                        "remediation_steps": m.group(6).strip(),
                    })
                log.info(f"[ZENTINEL] Parsed {len(parsed_findings)} FINDING blocks from report file")

            # Use parsed findings if we got them, else fall back to tracer
            save_findings = parsed_findings if parsed_findings else findings
            log.info(f"[ZENTINEL] Saving {len(save_findings)} findings to issues table | repo_id={repo_id}")

            # Fetch existing issue titles for this repo to avoid duplicates across re-runs.
            # The AI may find 6 issues one run, 3 the next — without this check every run
            # would pile up duplicate rows in the DB for the same vulnerability.
            existing_resp = supabase_admin.table("issues").select("title").eq("repository_id", repo_id).execute()
            existing_titles = {row["title"].lower().strip() for row in (existing_resp.data or [])}
            log.info(f"[ZENTINEL] {len(existing_titles)} existing issues in DB for this repo (dedup check)")

            inserted = 0
            for idx, fw in enumerate(save_findings):
                title = fw.get("title", f"Vulnerability {idx+1}")[:255]
                # Skip if a finding with the same title already exists for this repo.
                # Prevents duplicate rows when the same codebase is scanned multiple times.
                if title.lower().strip() in existing_titles:
                    log.info(f"[ZENTINEL] Skipping duplicate finding: {title}")
                    continue

                # Column mapping matches actual `issues` table schema:
                #   remediation_steps → fix_description
                #   poc_description   → poc_request
                #   poc_script_code   → poc_response
                issue_data = {
                    "organization_id": org_id,
                    "repository_id": repo_id,
                    "title": title,
                    "severity": fw.get("severity", "medium").lower(),
                    "status": "open",
                    "description": fw.get("description", fw.get("title", "")),
                    "fix_description": fw.get("remediation_steps", ""),
                    "poc_request": fw.get("poc_description", fw.get("file_path", "")),
                    "poc_response": fw.get("poc_script_code", ""),
                }
                supabase_admin.table("issues").insert(issue_data).execute()
                existing_titles.add(title.lower().strip())  # Guard within this run too
                inserted += 1

            log.info(f"[ZENTINEL] Inserted {inserted} new findings (skipped {len(save_findings) - inserted} duplicates)")

            # Recount from parsed findings if they exist
            if parsed_findings:
                critical_count = sum(1 for f in parsed_findings if f["severity"] == "critical")
                high_count = sum(1 for f in parsed_findings if f["severity"] == "high")
                medium_count = sum(1 for f in parsed_findings if f["severity"] == "medium")
                findings = parsed_findings  # update for issues_found count

            # Always post a commit status for full_repo scans (even if clean)
            if commit_sha:
                status_state = "failure" if critical_count > 0 else "success"
                status_desc = (
                    f"Zentinel: {critical_count} critical vulnerabilities found." if critical_count > 0
                    else "✅ Zentinel security scan passed — no vulnerabilities found"
                )
                with httpx.Client(timeout=30) as client:
                    adapter.set_commit_status(client, commit_sha, status_state, status_desc)
                log.info(f"[ZENTINEL] Commit status posted for full_repo scan | state={status_state}")

        # 11. Update DB with final results (store final_report for UI drill-down)
        supabase_admin.table("pr_reviews").update({
            "status": "completed",
            "completed_at": "now()",
            "issues_found": len(findings),
            "critical_count": critical_count,
            "high_count": high_count,
            "medium_count": medium_count,
            "final_report": str(final_report or "")[:100000],  # type: ignore[index]
            "strix_duration_seconds": scan_duration_s,
        }).eq("id", pr_review_id).execute()

        log.info(f"[ZENTINEL] Task finished | pr_review_id={pr_review_id} status=completed findings={len(findings)}")

        # Email notification
        import os as _os, httpx as _httpx
        _notify_secret = _os.environ.get("NOTIFY_SECRET", "")
        _notify_url = _os.environ.get("FRONTEND_URL", "https://app.zentinel.dev")
        if _notify_secret:
            try:
                _httpx.post(f"{_notify_url}/api/notify/pr-complete",
                    json={"pr_review_id": pr_review_id},
                    headers={"x-notify-secret": _notify_secret}, timeout=10)
            except Exception:
                pass
        publish_event(redis_channel, "status", {
            "status": "completed",
            "message": f"Scan complete — {len(findings)} finding{'s' if len(findings) != 1 else ''} discovered.",
            "findings_count": len(findings)
        })

    except SoftTimeLimitExceeded:
        log.error(f"[ZENTINEL] Scan timed out: {pr_review_id}")
        supabase_admin.table("pr_reviews").update({
            "status": "failed",
            "completed_at": "now()",
            "final_report": "Scan timed out after 90 minutes. Please retry."
        }).eq("id", pr_review_id).execute()
        publish_event(redis_channel, "error", {"message": "Scan timed out after 90 minutes. Please retry."})
        return

    except Retry:
        raise

    except Exception as e:
        import traceback
        # APIError in postgrest often puts the real error in e.message or e.details
        err_msg = getattr(e, "message", None) or getattr(e, "details", None) or repr(e)
        
        err_lower = str(err_msg).lower()
        if "429" in err_lower or "quota" in err_lower or "resource" in err_lower and "exhausted" in err_lower or "too many requests" in err_lower:
            log.warning(f"[ZENTINEL] 429 Rate Limit caught in outer exception: {err_msg}. Retrying Celery task...")
            raise self.retry(exc=e, countdown=180, max_retries=4)

        log.error(f"[ZENTINEL] Task FAILED | pr_review_id={pr_review_id} repo={repo_full_name} error={err_msg}")
        log.error(f"[ZENTINEL] Full traceback: \n{traceback.format_exc()}")
        supabase_admin.table("pr_reviews").update({
            "status": "failed",
            "completed_at": "now()"
        }).eq("id", pr_review_id).execute()
        raise

    finally:
        # Always clean up the Strix sandbox container for this scan
        import subprocess

        # 🔐 SECURITY: Validate pr_review_id is UUID format before using in shell command
        # Note: `re` is already imported at the top of the file. Do NOT re-import it here —
        # a local `import re` inside a finally block causes Python to treat `re` as a local
        # variable for the ENTIRE function scope, making `re.finditer()` on line 618 raise
        # UnboundLocalError even though the top-level import is present.
        # Prevents command injection even though UUID4s are safe by design
        if not re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', pr_review_id):
            log.error(f"[ZENTINEL] Invalid pr_review_id format, skipping Docker cleanup: {pr_review_id}")
        else:
            scan_container = f"strix-scan-pr_{pr_review_id}"
            log.info(f"[ZENTINEL] Cleaning up Docker container: {scan_container}")
            subprocess.run(["docker", "stop", scan_container], capture_output=True)
            subprocess.run(["docker", "rm", scan_container], capture_output=True)
            log.info(f"[ZENTINEL] Docker cleanup done for {scan_container}")

        strix_logger.removeHandler(log_handler)
