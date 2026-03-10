import asyncio
import httpx
import json
from celery import shared_task
from app.services.supabase import supabase_admin
from app.services.redis_service import publish_event
from app.core.config import settings

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

@shared_task(name="run_pr_review_task", bind=True, max_retries=1)
def run_pr_review_task(self, org_id: str, repo_id: str, pr_review_id: str, repo_full_name: str, clone_url: str, pr_number: int, branch_name: str, commit_sha: str, block_merge_on_critical: bool):
    try:
        # Lookup Token
        integ = supabase_admin.table("integrations").select("access_token").eq("organization_id", org_id).eq("provider", "github").execute().data
        if not integ:
            raise Exception("GitHub integration not found for organization")
        github_token = integ[0]["access_token"]

        headers = {
            "Authorization": f"Bearer {github_token}",
            "X-GitHub-Api-Version": "2022-11-28"
        }

        # 1. Fetch raw PR unified diff
        diff_headers = headers.copy()
        diff_headers["Accept"] = "application/vnd.github.v3.diff"
        
        diff_url = f"https://api.github.com/repos/{repo_full_name}/pulls/{pr_number}"
        
        with httpx.Client() as client:
            diff_res = client.get(diff_url, headers=diff_headers)
            diff_res.raise_for_status()
            raw_diff = diff_res.text

            # Update DB with diff
            supabase_admin.table("pr_reviews").update({
                "diff_content": raw_diff,
                "status": "running"
            }).eq("id", pr_review_id).execute()

            # Optional: Fetch new file contents. GH API for files changed in PR:
            files_url = f"https://api.github.com/repos/{repo_full_name}/pulls/{pr_number}/files"
            files_res = client.get(files_url, headers=headers)
            files_res.raise_for_status()
            files_changed = files_res.json()
            
            new_file_contents = ""
            for file in files_changed:
                if file.get("status") == "added":
                    # Fetch raw content
                    raw_url = file.get("raw_url")
                    if raw_url:
                        raw_res = client.get(raw_url, headers=headers)
                        new_file_contents += f"\n\n--- NEW FILE: {file['filename']} ---\n{raw_res.text}\n"

        # Construct Agent Instruction
        full_instruction = STRIX_PR_INSTRUCTION + "\n\n=== PR RAW DIFF ===\n" + raw_diff
        if new_file_contents:
            full_instruction += "\n\n=== NEW FILES ADDED FULL CONTEXT ===\n" + new_file_contents
        
        # 2. Call Strix
        from strix.agents.StrixAgent import StrixAgent
        from strix.llm.config import LLMConfig
        from strix.telemetry.tracer import Tracer, set_global_tracer
        
        # Phase 2 dynamic validation config
        # We pass target_branch to let StrixAgent internally clone specifically the PR branch
        targets_info = [{
            "type": "repository", 
            "details": {
                "target_repo": clone_url, 
                "target_branch": branch_name
            }, 
            "original": clone_url
        }]
        
        agent_config = {"llm_config": LLMConfig(scan_mode="deep"), "max_iterations": 200, "non_interactive": True}
        scan_config = {"scan_id": f"pr_{pr_review_id}", "targets": targets_info, "user_instructions": full_instruction, "run_name": f"pr_{pr_review_id}"}
        
        tracer = Tracer(f"pr_{pr_review_id}")
        tracer.set_scan_config(scan_config)
        set_global_tracer(tracer)

        agent = StrixAgent(agent_config)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(agent.execute_scan(scan_config))
        loop.close()

        findings = tracer.vulnerability_reports
        final_report = tracer.final_scan_result

        # Update PR review status based on findings
        critical_count = sum(1 for f in findings if f.get("severity", "").lower() == "critical")
        
        # 3. Post Findings to GitHub Issue Comments
        _post_github_pr_comment(repo_full_name, pr_number, github_token, findings, final_report)

        # 4. CI/CD Gating
        if block_merge_on_critical:
            status_state = "failure" if critical_count > 0 else "success"
            status_desc = f"{critical_count} critical issues found by Zentinel." if critical_count > 0 else "Zentinel security checks passed."
            _post_github_commit_status(repo_full_name, commit_sha, github_token, status_state, status_desc)
            
        supabase_admin.table("pr_reviews").update({
            "status": "completed",
            "completed_at": "now()",
            "issues_found": len(findings)
        }).eq("id", pr_review_id).execute()

    except Exception as e:
        supabase_admin.table("pr_reviews").update({
            "status": "failed",
            "completed_at": "now()"
        }).eq("id", pr_review_id).execute()
        print(f"PR Review task failed: {str(e)}")


def _post_github_pr_comment(repo_full_name: str, pr_number: int, token: str, findings: list, final_report: str):
    headers = {"Authorization": f"Bearer {token}", "X-GitHub-Api-Version": "2022-11-28"}
    
    if not findings:
        body = "### 🛡️ Zentinel Elite Security Analysis: **PASSED**\nNo security vulnerabilities were detected in this pull request.\n\n"
        if final_report:
            body += f"<details><summary>Analysis details</summary>\n\n{final_report}\n\n</details>"
    else:
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

    url = f"https://api.github.com/repos/{repo_full_name}/issues/{pr_number}/comments"
    with httpx.Client() as client:
        res = client.post(url, headers=headers, json={"body": body})
        if res.status_code >= 400:
            print("Failed to post comment:", res.text)


def _post_github_commit_status(repo_full_name: str, commit_sha: str, token: str, state: str, description: str):
    headers = {"Authorization": f"Bearer {token}", "X-GitHub-Api-Version": "2022-11-28"}
    url = f"https://api.github.com/repos/{repo_full_name}/statuses/{commit_sha}"
    payload = {
        "state": state,
        "description": description[:140],
        "context": "Zentinel Security Scanner"
    }
    with httpx.Client() as client:
        res = client.post(url, headers=headers, json=payload)
        if res.status_code >= 400:
            print("Failed to post status:", res.text)
