import asyncio
import httpx
import json
import logging
import time
from celery import shared_task
from app.services.supabase import supabase_admin
from app.core.config import settings

log = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Strix Prompt
# ─────────────────────────────────────────────────────────────────────────────
STRIX_PR_INSTRUCTION = """
You are an elite security engineer reviewing a pull request. You have access to the full repository, a live Docker sandbox, and a browser. Do not just read the diff — actively attack it.

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
- Send actual HTTP requests to new API endpoints
- Attempt authentication bypass on added features
- Upload malicious files if file upload logic was changed
- Fuzz any new input fields
- Test OAuth/session state manipulation if auth logic changed
- If background jobs are added, test deserialization attacks (if applicable)

PHASE 3 — DEPENDENCY EXPLOIT CHECK
- If a new dependency is added, look for published exploit proofs-of-concept (PoCs).
- Map out the dependency chain to flag transitive dependencies with critical CVEs.

PHASE 4 — BUSINESS LOGIC EVALUATOR
- Understand the intent of the PR. What is this feature trying to do?
- How could a legitimate user abuse this new workflow?
- If it's billing/payment code, test for price manipulation, quantity bypass, or race conditions.
- If it introduces admin features, check privilege escalation from standard users.

PHASE 5 — REPORT
Output your findings exactly like this. Do not hallucinate. Do not skip checking the dynamic sandbox.

FINDING_1:
- Severity: CRITICAL | HIGH | MEDIUM | LOW
- File: path/to/file.py (Line X)
- Vulnerability: concise description
- Proof: curl command or python script that executes the attack
- Fix: Exact one-line code replacement

If the PR is completely clean and secure, state: PASSED, with a 1-sentence explanation.
"""

STRIX_FULL_REPO_INSTRUCTION = """
You are an elite security engineer performing a comprehensive security review of a repository codebase. You have access to the full repository, a live Docker sandbox, and a browser. Do not just read the code — actively attack it.

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
- Send actual HTTP requests to API endpoints
- Attempt authentication bypass
- Upload malicious files
- Fuzz any input fields

PHASE 3 — DEPENDENCY EXPLOIT CHECK
- Look for published exploit proofs-of-concept (PoCs) for any outdated dependencies.
- Map out the dependency chain to flag transitive dependencies with critical CVEs.

PHASE 4 — BUSINESS LOGIC EVALUATOR
- Understand the intent of the application.
- How could a legitimate user abuse workflows?
- Test for price manipulation, privilege escalation, etc.

PHASE 5 — REPORT
Output your findings exactly like this. Do not hallucinate. Do not skip checking the dynamic sandbox.

FINDING_1:
- Severity: CRITICAL | HIGH | MEDIUM | LOW
- File: path/to/file.py (Line X)
- Vulnerability: concise description
- Proof: curl command or python script that executes the attack
- Fix: Exact one-line code replacement

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
                        raw = client.get(raw_url, headers=self.headers)
                        filename = str(f.get("filename", ""))
                        content += f"\n\n--- NEW FILE: {filename} ---\n{raw.text}\n"
        return content

    def post_comment(self, client: httpx.Client, pr_id: int, body: str) -> None:
        url = f"https://api.github.com/repos/{self.repo}/issues/{pr_id}/comments"
        res = client.post(url, headers=self.headers, json={"body": body})
        if res.status_code >= 400:
            print("GitHub comment failed:", res.text)

    def set_commit_status(self, client: httpx.Client, sha: str, state: str, description: str) -> None:
        url = f"https://api.github.com/repos/{self.repo}/statuses/{sha}"
        desc_str = str(description)
        payload = {"state": state, "description": desc_str[:140], "context": "Zentinel Security Scanner"}
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
                        diff_text += f"\n--- a/{old_path}\n+++ b/{new_path}\n"
                        diff_text += str(change.get("diff", ""))
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
                        content += f"\n\n--- NEW FILE: {new_path} ---\n{file_diff}\n"
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
        payload = {"state": gitlab_state, "description": desc_str[:140], "name": "Zentinel Security Scanner"}
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
                current_file = line[6:]
                buffer = []
            elif current_file and is_new:
                if line.startswith("diff --git"):
                    # flush
                    new_files_content += f"\n\n--- NEW FILE: {str(current_file)} ---\n" + "\n".join(buffer)
                    current_file = None
                    is_new = False
                    buffer = []
                else:
                    buffer.append(line)
        if current_file and is_new and buffer:
            new_files_content += f"\n\n--- NEW FILE: {str(current_file)} ---\n" + "\n".join(buffer)
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
            "description": desc_str[:255],
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
@shared_task(name="run_pr_review_task", bind=True, max_retries=1)
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
    try:
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
        from strix.agents.StrixAgent import StrixAgent
        from strix.llm.config import LLMConfig
        from strix.telemetry.tracer import Tracer, set_global_tracer
        from strix.interface.utils import infer_target_type

        if trigger == "full_repo":
            full_instruction = STRIX_FULL_REPO_INSTRUCTION
            targets = [auth_clone_url]
        else:
            full_instruction = STRIX_PR_INSTRUCTION + "\n\n=== PR RAW DIFF ===\n" + raw_diff
            if new_file_contents:
                full_instruction += "\n\n=== NEW FILES ADDED FULL CONTEXT ===\n" + new_file_contents
            targets = [raw_diff]  # PR diff only

        targets_info = []
        for t in targets:
            try:
                target_type, extra = infer_target_type(t)
                targets_info.append({'url': t, 'type': target_type, **extra})
            except Exception as e:
                t_str = str(t)
                log.warning(f"[ZENTINEL] infer_target_type failed on {t_str[:30]}... error={str(e)}")
                # Fallback in case raw_diff isn't parsed well
                targets_info.append({'url': 'pr_diff.txt', 'type': 'file', 'content': t})

        log.info(f'[ZENTINEL] targets_info: {targets_info}')

        # 7. Call Strix
        agent_config = {"llm_config": LLMConfig(scan_mode="deep"), "max_iterations": 200, "non_interactive": True}
        scan_config = {"scan_id": f"pr_{pr_review_id}", "targets": targets_info, "user_instructions": full_instruction, "run_name": f"pr_{pr_review_id}"}

        tracer = Tracer(f"pr_{pr_review_id}")
        tracer.set_scan_config(scan_config)
        set_global_tracer(tracer)

        log.info(f'[ZENTINEL] scan_config: {json.dumps(scan_config, default=str)}')
        log.info(f"[ZENTINEL] Starting StrixAgent.execute_scan | repo={repo_full_name} trigger={trigger} branch={branch_name}")
        
        agent = StrixAgent(agent_config)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(agent.execute_scan(scan_config))
        loop.close()

        log.info(f'[ZENTINEL] execute_scan result keys: {list(result.keys()) if isinstance(result, dict) else type(result)}')

        findings = tracer.vulnerability_reports
        final_report = tracer.final_scan_result
        scan_duration_s = int(time.time() - scan_start_time)

        log.info(f"[ZENTINEL] Strix scan complete | findings={len(findings)} duration={scan_duration_s}s")

        if not findings:
            log.warning(f"[ZENTINEL] Zero findings returned — verifying Strix ran correctly | final_report_length={len(final_report or '')}")

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
            # Full repo scans: save findings to issues table
            log.info(f"[ZENTINEL] Saving {len(findings)} findings to issues table | repo_id={repo_id}")
            for idx, fw in enumerate(findings):
                issue_data = {
                    "repository_id": repo_id,
                    "title": fw.get("title", f"Vulnerability {idx+1}")[:255],
                    "severity": fw.get("severity", "medium").lower(),
                    "status": "open",
                    "file_path": fw.get("file_path", ""),
                    "description": fw.get("description", ""),
                    "remediation_steps": fw.get("remediation_steps", ""),
                    "poc_script_code": fw.get("poc_script_code", ""),
                    "poc_description": fw.get("poc_description", ""),
                }
                supabase_admin.table("issues").insert(issue_data).execute()

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
            "final_report": (final_report or "")[:50000],
            "strix_duration_seconds": scan_duration_s,
        }).eq("id", pr_review_id).execute()

        log.info(f"[ZENTINEL] Task finished | pr_review_id={pr_review_id} status=completed")

    except Exception as e:
        import traceback
        log.error(f"[ZENTINEL] Task FAILED | pr_review_id={pr_review_id} repo={repo_full_name} error={str(e)}")
        log.error(f"[ZENTINEL] Full traceback: \n{traceback.format_exc()}")
        supabase_admin.table("pr_reviews").update({
            "status": "failed",
            "completed_at": "now()"
        }).eq("id", pr_review_id).execute()
        raise
