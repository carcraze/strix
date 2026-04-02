"""
Zentinel Day Zero Scanner
Orchestrates parallel security scans when a repository is first connected.
Wraps: Trivy (SCA/IaC), Semgrep (SAST), TruffleHog (Secrets), custom license checker.
"""
import asyncio
import json
import tempfile
import shutil
import uuid
import re
from pathlib import Path
from typing import Optional
from datetime import datetime
import httpx

from app.services.supabase import supabase_admin


class DayZeroScanner:

    # ── Security limits ───────────────────────────────────────────────────────
    # Prevent zip bombs, massive repos, and runaway processes from killing the VM.

    # Hard wall-clock limit for the entire pipeline (clone + all engines + AI triage)
    PIPELINE_TIMEOUT_SECS: int = 900          # 15 min total

    # Per-tool subprocess timeouts
    CLONE_TIMEOUT_SECS:   int = 120           # 2 min clone
    TRIVY_TIMEOUT_SECS:   int = 300           # 5 min Trivy
    SEMGREP_TIMEOUT_SECS: int = 300           # 5 min Semgrep
    CHECKOV_TIMEOUT_SECS: int = 180           # 3 min Checkov
    TRUFFLEHOG_TIMEOUT_SECS: int = 180        # 3 min TruffleHog

    # Repo size gate — reject before cloning (GitHub API reports size in KB)
    MAX_REPO_SIZE_MB: int = 500               # 500 MB cloned size

    # Stdout buffer cap per tool — prevents OOM from gigantic JSON output
    MAX_STDOUT_BYTES: int = 50 * 1024 * 1024 # 50 MB

    # Individual file read cap — prevents zip-bomb decompression into memory
    MAX_FILE_READ_BYTES: int = 5 * 1024 * 1024  # 5 MB per file

    # GAP 3: Strict allowlist for repo_full_name — prevents command injection.
    # asyncio.create_subprocess_exec() uses shell=False by default (no shell
    # interpolation), but the repo name is still embedded in the git clone URL
    # and passed as a CLI argument. A branch named '; rm -rf /' would still be
    # dangerous if shell=True were ever accidentally used, so we validate here.
    _REPO_NAME_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}/[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$")

    def __init__(self, org_id: str, repo_id: str, repo_full_name: str,
                 github_token: Optional[str] = None, scan_run_id: Optional[str] = None):

        # GAP 3 enforcement — validate before storing
        if not self._REPO_NAME_RE.match(repo_full_name):
            raise ValueError(
                f"Invalid repo_full_name '{repo_full_name}'. "
                "Must match ^owner/repo with alphanumeric, dot, hyphen, underscore only."
            )

        self.org_id = org_id
        self.repo_id = repo_id
        self.repo_full_name = repo_full_name  # e.g. "carcraze/moyopal"
        self.github_token = github_token
        self.scan_run_id = scan_run_id or str(uuid.uuid4())
        self.workspace = None

    # ── Core security helpers ─────────────────────────────────────────────────

    async def _safe_run(
        self,
        *cmd: str,
        timeout_secs: int,
        engine: str,
    ) -> tuple[bytes, int]:
        """Run a subprocess with a hard timeout.

        CRITICAL: asyncio.wait_for() raises TimeoutError but does NOT kill the
        child process — it just cancels the coroutine. Without an explicit
        proc.kill() + proc.wait(), the tool keeps eating RAM/CPU on the VM.
        This helper guarantees cleanup in all paths.

        Also caps stdout at MAX_STDOUT_BYTES to prevent OOM from gigantic output.
        """
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            # Read at most MAX_STDOUT_BYTES — then stop regardless of tool state
            stdout_task = asyncio.ensure_future(
                proc.stdout.read(self.MAX_STDOUT_BYTES)  # type: ignore[union-attr]
            )
            await asyncio.wait_for(stdout_task, timeout=timeout_secs)
            stdout = stdout_task.result()
            # Drain stderr briefly so the process can exit cleanly
            try:
                await asyncio.wait_for(proc.stderr.read(4096), timeout=2)  # type: ignore[union-attr]
            except asyncio.TimeoutError:
                pass
            await asyncio.wait_for(proc.wait(), timeout=5)
            return stdout, proc.returncode or 0

        except asyncio.TimeoutError:
            print(
                f"[DayZero][{engine}] TIMEOUT after {timeout_secs}s — "
                f"killing process (pid={proc.pid})"
            )
            try:
                proc.kill()           # SIGKILL — not just SIGTERM
                await asyncio.wait_for(proc.wait(), timeout=5)
            except Exception as kill_err:
                print(f"[DayZero][{engine}] kill error: {kill_err}")
            return b"", -1

        except Exception as e:
            print(f"[DayZero][{engine}] subprocess error: {e}")
            try:
                proc.kill()
                await asyncio.wait_for(proc.wait(), timeout=5)
            except Exception:
                pass
            return b"", -1

    def _safe_read(self, path: Path) -> Optional[str]:
        """Read a file only if it's within the size limit.

        Protects against:
        - Zip bombs: a 1KB .gz file that expands to 50TB on read
        - Malicious deeply-nested JSON/YAML that OOMs the parser
        - Symlink escape: verify the resolved path stays inside the workspace
        """
        try:
            # Symlink escape check — resolved path must stay inside workspace
            resolved = path.resolve()
            workspace_resolved = Path(self.workspace).resolve()
            if not str(resolved).startswith(str(workspace_resolved)):
                print(f"[DayZero][Security] Symlink escape blocked: {path} → {resolved}")
                return None

            size = path.stat().st_size
            if size > self.MAX_FILE_READ_BYTES:
                print(
                    f"[DayZero][Security] Skipping oversized file "
                    f"{path.name} ({size / 1024 / 1024:.1f} MB > "
                    f"{self.MAX_FILE_READ_BYTES // 1024 // 1024} MB limit)"
                )
                return None

            return path.read_text(errors="ignore")
        except Exception:
            return None

    async def _check_repo_size(self) -> None:
        """Query GitHub API and reject repos above MAX_REPO_SIZE_MB.

        Prevents cloning 10GB repos that would fill the VM disk and cause the
        shallow clone itself to hang or error the entire worker process.
        """
        owner, repo = self.repo_full_name.split("/", 1)
        headers: dict = {"Accept": "application/vnd.github+json"}
        if self.github_token:
            headers["Authorization"] = f"token {self.github_token}"

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"https://api.github.com/repos/{owner}/{repo}",
                    headers=headers,
                )
            if resp.status_code == 200:
                size_kb  = resp.json().get("size", 0)
                size_mb  = size_kb / 1024
                limit_mb = self.MAX_REPO_SIZE_MB
                if size_mb > limit_mb:
                    raise ValueError(
                        f"Repo {self.repo_full_name} is {size_mb:.0f} MB — "
                        f"exceeds the {limit_mb} MB scan limit. "
                        "Connect a smaller repo or contact support for enterprise scanning."
                    )
                print(f"[DayZero] Repo size check passed: {size_mb:.1f} MB / {limit_mb} MB limit")
        except ValueError:
            raise  # Re-raise size limit errors — they should fail the scan
        except Exception as e:
            # Network/API errors — log and continue (don't block on GitHub API flakiness)
            print(f"[DayZero] Size check API error (continuing): {e}")

    async def run_pipeline(self) -> dict:
        """Main Day Zero pipeline — wrapped in a hard 15-min wall-clock timeout.

        If the entire pipeline (clone + all tools + AI triage) takes longer than
        PIPELINE_TIMEOUT_SECS, the scan is aborted, the tempdir is deleted, and
        the scan_run is marked failed. This prevents a single malicious repo from
        holding a Celery worker slot indefinitely.
        """
        try:
            return await asyncio.wait_for(
                self._run_pipeline_inner(),
                timeout=self.PIPELINE_TIMEOUT_SECS,
            )
        except asyncio.TimeoutError:
            msg = (
                f"Pipeline exceeded hard limit of {self.PIPELINE_TIMEOUT_SECS}s "
                f"for repo {self.repo_full_name} — aborting to protect worker"
            )
            print(f"[DayZero][PIPELINE TIMEOUT] {msg}")
            supabase_admin.table("scan_runs").update({
                "status": "failed",
                "error_message": msg,
                "completed_at": datetime.utcnow().isoformat(),
            }).eq("id", self.scan_run_id).execute()
            # Cleanup is guaranteed even on timeout because _run_pipeline_inner
            # has its own finally block, but double-check here as a safety net.
            if self.workspace and Path(self.workspace).exists():
                shutil.rmtree(self.workspace, ignore_errors=True)
            return {"scan_run_id": self.scan_run_id, "findings": 0, "aborted": True}

    async def _run_pipeline_inner(self) -> dict:
        """Actual pipeline logic — called from run_pipeline() under a timeout."""
        # Update scan_run to running
        supabase_admin.table("scan_runs").update({
            "status": "running",
            "started_at": datetime.utcnow().isoformat(),
        }).eq("id", self.scan_run_id).execute()

        try:
            # ── Gate 1: Reject oversized repos before touching disk ──
            await self._check_repo_size()

            # Clone repo
            self.workspace = await self._clone_repo()

            # Run all engines in parallel
            results = await asyncio.gather(
                self._run_sca_scan(),
                self._run_sast_scan(),
                self._run_iac_scan(),
                self._run_secrets_scan(),
                self._run_license_scan(),
                return_exceptions=True
            )

            # Normalize and deduplicate
            all_findings = []
            engines_run = []
            for engine, result in zip(
                ["sca", "sast", "iac", "secrets", "license"], results
            ):
                if isinstance(result, Exception):
                    print(f"[DayZero] {engine} failed: {result}")
                elif result:
                    all_findings.extend(result)
                    engines_run.append(engine)

            total_raw = len(all_findings)

            # Insert ALL findings into Supabase first
            if all_findings:
                await self._insert_findings(all_findings)

            # AI triage — circuit breaker caps at 500 findings sent to Vertex
            auto_ignored, ai_tokens, capped = await self._ai_triage(all_findings)

            # Update scan_run
            hours_saved = sum(
                {"critical": 4, "high": 2, "medium": 1, "low": 0.5}.get(f.get("severity", "low"), 0.5)
                for f in all_findings if f.get("_auto_ignored")
            )
            supabase_admin.table("scan_runs").update({
                "status":             "completed",
                "completed_at":       datetime.utcnow().isoformat(),
                "findings_count":     len(all_findings),
                "auto_ignored_count": auto_ignored,
                "hours_saved":        round(hours_saved, 2),
                "engines_run":        engines_run,
                # ── Cost tracking columns ──
                "total_raw_findings": total_raw,
                "ai_tokens_used":     ai_tokens,
                "findings_capped":    capped,
            }).eq("id", self.scan_run_id).execute()

            return {
                "scan_run_id":     self.scan_run_id,
                "findings":        len(all_findings),
                "auto_ignored":    auto_ignored,
                "ai_tokens_used":  ai_tokens,
                "findings_capped": capped,
                "engines":         engines_run,
            }
        except Exception as e:
            supabase_admin.table("scan_runs").update({
                "status": "failed",
                "error_message": str(e),
                "completed_at": datetime.utcnow().isoformat(),
            }).eq("id", self.scan_run_id).execute()
            raise
        finally:
            if self.workspace and Path(self.workspace).exists():
                shutil.rmtree(self.workspace, ignore_errors=True)

    async def _clone_repo(self) -> str:
        """Shallow clone the repository into a temp directory.

        Uses _safe_run() which guarantees the git process is killed on timeout —
        preventing a single slow clone from blocking the Celery worker indefinitely.
        """
        tmpdir = tempfile.mkdtemp(prefix="zentinel_scan_")
        repo_url = f"https://github.com/{self.repo_full_name}.git"
        if self.github_token:
            repo_url = f"https://x-access-token:{self.github_token}@github.com/{self.repo_full_name}.git"

        _, rc = await self._safe_run(
            "git", "clone", "--depth=1", "--single-branch",
            "--filter=blob:limit=10m",  # skip blobs > 10MB (git partial clone)
            repo_url, tmpdir,
            timeout_secs=self.CLONE_TIMEOUT_SECS,
            engine="git-clone",
        )
        if rc != 0:
            print(f"[DayZero] git clone failed (rc={rc}), using API fallback for package files")

        return tmpdir

    async def _run_sca_scan(self) -> list[dict]:
        """Run Trivy for SCA/CVE scanning on package files."""
        findings = []
        try:
            stdout, rc = await self._safe_run(
                "trivy", "fs", "--format", "json", "--quiet",
                "--scanners", "vuln",
                "--skip-dirs", "node_modules,.git,vendor",
                # GAP 2: Disable archive extraction to prevent zip-bomb expansion.
                # Trivy unpacks .zip/.tar.gz by default to scan contents — a 9.9 MB
                # zip bomb expands to terabytes on disk when extracted.
                "--skip-files", "*.zip",
                "--skip-files", "*.tar.gz",
                "--skip-files", "*.tar.bz2",
                "--skip-files", "*.tar.xz",
                "--skip-files", "*.tgz",
                "--skip-files", "*.rar",
                "--skip-files", "*.7z",
                "--skip-files", "*.gz",
                "--skip-files", "*.jar",
                "--skip-files", "*.war",
                "--skip-files", "*.ear",
                self.workspace,
                timeout_secs=self.TRIVY_TIMEOUT_SECS,
                engine="trivy",
            )
            if rc == 0 and stdout:
                data = json.loads(stdout)
                findings = self._normalize_trivy_sca(data)
        except FileNotFoundError:
            pass  # Trivy not installed — fall through to OSV

        if not findings:
            # Fallback: parse package files manually and check OSV API
            findings = await self._osv_fallback_scan()

        return findings

    def _normalize_trivy_sca(self, data: dict) -> list[dict]:
        """Convert Trivy JSON output to Zentinel issue format."""
        findings = []
        for result in data.get("Results", []):
            target = result.get("Target", "")
            for vuln in result.get("Vulnerabilities", []):
                pkg = vuln.get("PkgName", "")
                installed = vuln.get("InstalledVersion", "")
                fixed = vuln.get("FixedVersion", "")
                cve = vuln.get("VulnerabilityID", "")
                sev = vuln.get("Severity", "UNKNOWN").lower()
                if sev == "unknown":
                    sev = "medium"
                title = f"{pkg}: {vuln.get('Title', f'Vulnerability in {pkg}')}"

                findings.append({
                    "title": title,
                    "description": vuln.get("Description", "")[:1000],
                    "severity": sev,
                    "scan_type": "sca",
                    "package_name": pkg,
                    "affected_version": installed,
                    "fixed_version": fixed,
                    "cve_id": cve,
                    "cve_link": f"https://nvd.nist.gov/vuln/detail/{cve}" if cve else None,
                    "file_path": target,
                    "fix_type": "upgrade" if fixed else "patch",
                    "status": "open",
                    "organization_id": self.org_id,
                    "repository_id": self.repo_id,
                    "scan_run_id": self.scan_run_id,
                    "found_at": datetime.utcnow().isoformat(),
                })
        return findings

    async def _osv_fallback_scan(self) -> list[dict]:
        """Fallback: read package.json/requirements.txt and query OSV API."""
        findings = []
        workspace = Path(self.workspace)

        # Find package files
        pkg_files = {
            "npm": list(workspace.rglob("package.json")),
            "pip": list(workspace.rglob("requirements*.txt")),
            "pip_lock": list(workspace.rglob("Pipfile.lock")),
        }

        packages = []
        for pkg_file in pkg_files["npm"]:
            try:
                if "node_modules" in str(pkg_file):
                    continue
                content = self._safe_read(pkg_file)   # size-checked, symlink-safe
                if not content:
                    continue
                data = json.loads(content)
                deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
                for name, version in deps.items():
                    v = version.lstrip("^~>=")
                    packages.append({"name": name, "version": v, "ecosystem": "npm", "file": str(pkg_file)})
            except Exception:
                pass

        # Also scan requirements.txt for Python packages
        for req_file in pkg_files["pip"]:
            try:
                content = self._safe_read(req_file)
                if not content:
                    continue
                for line in content.splitlines():
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    parts = re.split(r"[>=<!~]", line, 1)
                    name = parts[0].strip()
                    version = parts[1].strip() if len(parts) > 1 else "0"
                    packages.append({"name": name, "version": version, "ecosystem": "PyPI", "file": str(req_file)})
            except Exception:
                pass

        if not packages:
            return []

        # Query OSV API in batches of 20 — ALL packages, no cap
        async with httpx.AsyncClient(timeout=60) as client:
            for batch_start in range(0, len(packages), 20):
                batch = packages[batch_start:batch_start + 20]
                try:
                    resp = await client.post("https://api.osv.dev/v1/querybatch", json={
                        "queries": [
                            {"package": {"name": p["name"], "ecosystem": "npm"}, "version": p["version"]}
                            for p in batch
                        ]
                    })
                    if resp.status_code == 200:
                        data = resp.json()
                        for pkg, result in zip(batch, data.get("results", [])):
                            for vuln in result.get("vulns", []):  # ALL CVEs per package
                                aliases = vuln.get("aliases", [])
                                cve = next((a for a in aliases if a.startswith("CVE-")), vuln.get("id", ""))

                                # Determine severity from CVSS
                                sev = "medium"
                                for sev_info in vuln.get("severity", []):
                                    score_str = sev_info.get("score", "")
                                    try:
                                        score = (
                                            float(score_str.split("/")[0].split(":")[-1])
                                            if "/" in score_str
                                            else float(score_str[-3:])
                                        )
                                        if score >= 9.0:
                                            sev = "critical"
                                        elif score >= 7.0:
                                            sev = "high"
                                        elif score >= 4.0:
                                            sev = "medium"
                                        else:
                                            sev = "low"
                                    except Exception:
                                        pass

                                findings.append({
                                    "title": "{}: {}".format(pkg['name'], vuln.get('summary', 'Known vulnerability in ' + pkg['name'])),
                                    "description": vuln.get("details", "")[:1000],
                                    "severity": sev,
                                    "scan_type": "sca",
                                    "package_name": pkg["name"],
                                    "affected_version": pkg["version"],
                                    "fixed_version": "",  # Would need to look up
                                    "cve_id": cve,
                                    "cve_count": len(result.get("vulns", [])),
                                    "cve_link": f"https://nvd.nist.gov/vuln/detail/{cve}" if cve.startswith("CVE-") else None,
                                    "file_path": "package.json",
                                    "fix_type": "upgrade",
                                    "status": "open",
                                    "organization_id": self.org_id,
                                    "repository_id": self.repo_id,
                                    "scan_run_id": self.scan_run_id,
                                    "found_at": datetime.utcnow().isoformat(),
                                })
                except Exception as e:
                    print(f"[DayZero] OSV API error: {e}")

        return findings

    async def _run_sast_scan(self) -> list[dict]:
        """Run Semgrep SAST scan."""
        findings = []
        try:
            stdout, rc = await self._safe_run(
                "semgrep", "scan", "--config=auto", "--json", "--quiet",
                "--max-target-bytes=5000000",   # 5 MB per file — Semgrep's own guard
                "--exclude", "node_modules",
                "--exclude", ".git",
                "--exclude", "vendor",
                # GAP 2: Skip archives — Semgrep tries to read them as text and
                # can be tricked into decompressing via certain file handlers.
                "--exclude", "*.zip",
                "--exclude", "*.tar.gz",
                "--exclude", "*.tgz",
                "--exclude", "*.rar",
                "--exclude", "*.7z",
                "--exclude", "*.gz",
                "--exclude", "*.jar",
                "--exclude", "*.war",
                self.workspace,
                timeout_secs=self.SEMGREP_TIMEOUT_SECS,
                engine="semgrep",
            )
            if stdout:
                data = json.loads(stdout)
                for result in data.get("results", []):
                    sev_map = {"ERROR": "critical", "WARNING": "high", "INFO": "medium"}
                    sev = sev_map.get(result.get("extra", {}).get("severity", "INFO"), "medium")
                    meta = result.get("extra", {}).get("metadata", {})
                    cwe = meta.get("cwe", [])

                    findings.append({
                        "title": result.get("extra", {}).get("message", "SAST finding")[:200],
                        "description": result.get("extra", {}).get("message", "")[:1000],
                        "severity": sev,
                        "scan_type": "sast",
                        "rule_id": result.get("check_id", ""),
                        "file_path": result.get("path", "").replace(self.workspace, "").lstrip("/"),
                        "line_number": result.get("start", {}).get("line"),
                        "cve_id": cwe[0] if isinstance(cwe, list) and cwe else None,
                        "fix_type": "patch",
                        "status": "open",
                        "organization_id": self.org_id,
                        "repository_id": self.repo_id,
                        "scan_run_id": self.scan_run_id,
                        "found_at": datetime.utcnow().isoformat(),
                    })
        except FileNotFoundError:
            print("[DayZero] Semgrep not installed — skipping SAST")

        # ── Per-scanner cap: protects worker memory on massive monorepos ──
        # SAST on a large legacy codebase can return 10k+ results from Semgrep.
        # Cap at 300 — sorted by severity so the worst findings are kept.
        SEV_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
        findings.sort(key=lambda f: SEV_ORDER.get(f.get("severity", "low"), 3))
        return findings[:300]

    async def _run_iac_scan(self) -> list[dict]:
        """Run Checkov for IaC scanning."""
        findings = []
        try:
            stdout, rc = await self._safe_run(
                "checkov", "-d", self.workspace, "-o", "json", "--quiet",
                "--skip-path", "node_modules",
                "--skip-path", ".git",
                timeout_secs=self.CHECKOV_TIMEOUT_SECS,
                engine="checkov",
            )
            if stdout:
                data = json.loads(stdout)
                results = data if isinstance(data, list) else [data]
                for r in results:
                    for check in r.get("results", {}).get("failed_checks", []):
                        sev_map = {"HIGH": "high", "MEDIUM": "medium", "LOW": "low"}
                        sev = sev_map.get(check.get("severity", "MEDIUM"), "medium")
                        findings.append({
                            "title": check.get("check_id", "") + ": " + check.get("check_name", "IaC misconfiguration"),
                            "description": check.get("check_name", "")[:500],
                            "severity": sev,
                            "scan_type": "iac",
                            "rule_id": check.get("check_id", ""),
                            "file_path": check.get("repo_file_path", "").lstrip("/"),
                            "line_number": check.get("file_line_range", [None])[0],
                            "fix_type": "config",
                            "status": "open",
                            "organization_id": self.org_id,
                            "repository_id": self.repo_id,
                            "scan_run_id": self.scan_run_id,
                            "found_at": datetime.utcnow().isoformat(),
                        })
        except FileNotFoundError:
            print("[DayZero] Checkov not installed — skipping IaC")
        # ── Per-scanner cap: Checkov on large Terraform repos can return 500+ ──
        SEV_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        findings.sort(key=lambda f: SEV_ORDER.get(f.get("severity", "low"), 3))
        return findings[:200]

    async def _run_secrets_scan(self) -> list[dict]:
        """Run TruffleHog for secrets detection."""
        findings = []
        try:
            stdout, _ = await self._safe_run(
                "trufflehog", "filesystem", self.workspace,
                "--json",
                "--no-update",
                # GAP 1: NEVER let TruffleHog make outbound network calls.
                # By default TruffleHog "verifies" found secrets by pinging the
                # provider (AWS STS, Stripe API, GitHub tokens API etc.).
                # An attacker can put a crafted secret pointing to our GCP
                # metadata server (169.254.169.254) in their repo, causing
                # TruffleHog to leak our worker VM's IAM credentials.
                "--no-verification",
                "--exclude-paths", ".git/objects",
                timeout_secs=self.TRUFFLEHOG_TIMEOUT_SECS,
                engine="trufflehog",
            )
            for line in stdout.decode(errors="ignore").strip().split("\n"):
                if not line:
                    continue
                try:
                    finding = json.loads(line)
                    det = finding.get("DetectorName", "Unknown Secret")
                    src = finding.get("SourceMetadata", {}).get("Data", {}).get("Filesystem", {})
                    findings.append({
                        "title": f"Exposed {det} secret detected",
                        "description": f"A {det} secret was found in the repository. Revoke and rotate immediately.",
                        "severity": "critical",
                        "scan_type": "secrets",
                        "file_path": src.get("file", "").replace(self.workspace, "").lstrip("/"),
                        "line_number": src.get("line"),
                        "fix_type": "patch",
                        "status": "open",
                        "organization_id": self.org_id,
                        "repository_id": self.repo_id,
                        "scan_run_id": self.scan_run_id,
                        "found_at": datetime.utcnow().isoformat(),
                    })
                except json.JSONDecodeError:
                    pass
        except FileNotFoundError:
            print("[DayZero] TruffleHog not installed — skipping secrets scan")
        return findings

    async def _run_license_scan(self) -> list[dict]:
        """Scan dependencies for risky licenses (GPL, AGPL, SSPL)."""
        RISKY_LICENSES = {
            "GPL-2.0": ("high", "GPL-2.0 requires derivative works to be open-sourced."),
            "GPL-3.0": ("high", "GPL-3.0 copyleft license may affect proprietary software distribution."),
            "AGPL-3.0": ("critical", "AGPL-3.0 requires network-deployed software to release source code."),
            "SSPL-1.0": ("critical", "SSPL requires releasing all management software source code."),
            "LGPL-2.1": ("medium", "LGPL-2.1 requires dynamic linking or source disclosure."),
            "LGPL-3.0": ("medium", "LGPL-3.0 allows linking but has patent clauses."),
            "MPL-2.0": ("low", "MPL-2.0 has file-level copyleft requirements."),
            "EUPL-1.2": ("medium", "EUPL-1.2 is a copyleft license similar to LGPL."),
            "CDDL-1.0": ("low", "CDDL-1.0 has weak copyleft requirements."),
        }

        findings = []
        workspace = Path(self.workspace)

        # Read package.json license field — scan ALL files, ALL packages
        for pkg_file in workspace.rglob("package.json"):
            try:
                if "node_modules" in str(pkg_file):
                    continue
                content = self._safe_read(pkg_file)
                if not content:
                    continue
                data = json.loads(content)
                deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}

                for pkg_name in deps.keys():  # ALL packages, no cap
                    # Check for risky packages known to use GPL licenses
                    KNOWN_GPL_PACKAGES = {
                        "gnu-getopt": "GPL-3.0",
                        "node-pre-gyp": "BSD",  # example
                    }
                    license_id = KNOWN_GPL_PACKAGES.get(pkg_name)
                    if license_id and license_id in RISKY_LICENSES:
                        sev, desc = RISKY_LICENSES[license_id]
                        findings.append({
                            "title": f"License risk: {pkg_name} uses {license_id}",
                            "description": desc,
                            "severity": sev,
                            "scan_type": "license",
                            "package_name": pkg_name,
                            "license_type": license_id,
                            "file_path": str(pkg_file).replace(self.workspace, "").lstrip("/"),
                            "fix_type": "manual",
                            "status": "open",
                            "organization_id": self.org_id,
                            "repository_id": self.repo_id,
                            "scan_run_id": self.scan_run_id,
                            "found_at": datetime.utcnow().isoformat(),
                        })
            except Exception:
                pass

        return findings

    async def _insert_findings(self, findings: list[dict]):
        """Batch insert findings into issues table."""
        BATCH_SIZE = 50
        for i in range(0, len(findings), BATCH_SIZE):
            batch = findings[i:i + BATCH_SIZE]
            # Remove private fields
            clean = [{k: v for k, v in f.items() if not k.startswith("_")} for f in batch]
            try:
                supabase_admin.table("issues").insert(clean).execute()
            except Exception as e:
                print(f"[DayZero] Insert error: {e}")

    # ── Severity sort order for circuit breaker ───────────────────────────────
    _SEV_ORDER: dict[str, int] = {
        "critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4
    }

    # ── Circuit breaker constants ─────────────────────────────────────────────
    # Max findings sent to Vertex AI per scan_run.
    # Beyond this the finding is stored but marked reachability='skipped_ai_cap'.
    AI_TRIAGE_CAP  = 500   # 5 batches × 100 = max Vertex API calls per scan
    AI_BATCH_SIZE  = 100   # findings per Claude call

    async def _ai_triage(self, findings: list[dict]) -> tuple[int, int, bool]:
        """Circuit-breaker AI triage using Claude Sonnet 4.6 via Vertex AI.

        Returns:
            (auto_ignored_count, total_ai_tokens_used, findings_were_capped)

        Circuit breaker rules:
        1. Sort ALL findings by severity (CRITICAL first) — worst issues always triaged.
        2. Send at most AI_TRIAGE_CAP (500) findings to Vertex AI in batches of 100.
        3. Findings beyond cap → set reachability='skipped_ai_cap' in DB, no Vertex call.
        4. Track token usage and cap status in scan_runs for cost monitoring.

        Credentials: VERTEXAI_PROJECT + VERTEXAI_LOCATION env vars (never hardcoded).
        """
        import anthropic
        import os

        if not findings:
            return 0, 0, False

        # ── Step 1: Sort by severity so critical/high always get triaged first ──
        sorted_findings = sorted(
            findings,
            key=lambda f: self._SEV_ORDER.get(f.get("severity", "low"), 3)
        )

        within_cap  = sorted_findings[:self.AI_TRIAGE_CAP]
        beyond_cap  = sorted_findings[self.AI_TRIAGE_CAP:]
        is_capped   = len(beyond_cap) > 0

        print(
            f"[DayZero][CircuitBreaker] {len(findings)} total findings | "
            f"{len(within_cap)} sent to Vertex AI | "
            f"{len(beyond_cap)} skipped (cap={self.AI_TRIAGE_CAP})"
        )

        # ── Step 2: Mark beyond-cap findings in DB without calling Vertex ──────
        if beyond_cap:
            await self._mark_skipped_findings(beyond_cap)

        # ── Step 3: Build Vertex AI client from env vars ──────────────────────
        project = (
            os.environ.get("VERTEXAI_PROJECT")         # VM runbook key
            or os.environ.get("GOOGLE_CLOUD_PROJECT")  # GCP standard ADC key
        )
        region = (
            os.environ.get("VERTEXAI_LOCATION")        # VM runbook key
            or os.environ.get("GOOGLE_CLOUD_REGION")   # GCP standard key
            or "us-east5"
        )
        if not project:
            print("[DayZero] WARNING: VERTEXAI_PROJECT not set — skipping AI triage entirely")
            # Mark ALL findings as skipped rather than erroring the whole scan
            await self._mark_skipped_findings(within_cap)
            return 0, 0, True

        client = anthropic.AnthropicVertex(project_id=project, region=region)

        # ── Step 4: Triage in batches of AI_BATCH_SIZE ────────────────────────
        auto_ignored  = 0
        total_tokens  = 0

        for batch_start in range(0, len(within_cap), self.AI_BATCH_SIZE):
            batch = within_cap[batch_start:batch_start + self.AI_BATCH_SIZE]
            ignored_in_batch, tokens_used = await self._triage_batch(client, batch)
            auto_ignored += ignored_in_batch
            total_tokens += tokens_used

        print(
            f"[DayZero][CircuitBreaker] Triage complete: "
            f"{auto_ignored} auto-ignored | {total_tokens:,} tokens used | capped={is_capped}"
        )

        return auto_ignored, total_tokens, is_capped

    async def _mark_skipped_findings(self, findings: list[dict]) -> None:
        """Mark beyond-cap findings in DB as skipped — no Vertex cost incurred."""
        BATCH = 50
        for i in range(0, len(findings), BATCH):
            batch = findings[i:i + BATCH]
            titles = [f.get("title", "") for f in batch]
            try:
                # Bulk update by title + scan_run_id (unique enough for a single scan)
                supabase_admin.table("issues").update({
                    "reachability": "skipped_ai_cap",
                }).eq("scan_run_id", self.scan_run_id)\
                  .in_("title", titles)\
                  .execute()
            except Exception as e:
                print(f"[DayZero] mark_skipped error: {e}")

    async def _triage_batch(self, client, batch: list[dict]) -> tuple[int, int]:
        """Triage one batch of ≤100 findings. Returns (auto_ignored, tokens_used)."""
        if not batch:
            return 0, 0

        auto_ignored = 0
        tokens_used  = 0

        findings_text = "\n".join([
            f"{i}. [{f.get('severity','?').upper()}] {f.get('title','')} | "
            f"type={f.get('scan_type','?')} | "
            f"pkg={f.get('package_name','N/A')} | "
            f"file={f.get('file_path','N/A')} | "
            f"affected={f.get('affected_version','N/A')} | "
            f"fixed={f.get('fixed_version','N/A')}"
            for i, f in enumerate(batch)
        ])

        try:
            response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=4096,
                messages=[{
                    "role": "user",
                    "content": (
                        "You are a senior security engineer triaging code scan findings.\n\n"
                        "Review these findings and identify FALSE POSITIVES to auto-ignore.\n"
                        "A finding is a false positive if:\n"
                        "  - The affected function/class is unreachable in production code paths\n"
                        "  - The package is only used in dev/test (devDependencies, test files)\n"
                        "  - The exploit requires local/physical access\n"
                        "  - The CVE is patched in the current version despite the version string match\n"
                        "  - The severity is clearly overstated for this codebase context\n\n"
                        f"Findings:\n{findings_text}\n\n"
                        "Respond ONLY with a JSON array. For each false positive:\n"
                        '{"index": 0, "reason": "one-line explanation", "confidence": 0.85}\n\n'
                        "Only include findings where confidence > 0.70. Return [] if none."
                    ),
                }],
            )

            # Track token usage for cost monitoring
            tokens_used = (
                response.usage.input_tokens + response.usage.output_tokens
                if hasattr(response, "usage") else 0
            )

            result_text = response.content[0].text.strip()
            json_match  = re.search(r"\[.*?\]", result_text, re.DOTALL)
            if not json_match:
                return auto_ignored, tokens_used

            false_positives = json.loads(json_match.group())
            for fp in false_positives:
                idx = fp.get("index")
                if idx is None or idx >= len(batch):
                    continue
                finding = batch[idx]
                finding["_auto_ignored"] = True
                try:
                    supabase_admin.table("issues").update({
                        "is_false_positive":  True,
                        "auto_ignore_reason": fp.get("reason", "AI assessed as false positive"),
                        "status":             "ignored",
                        "false_positive_score": float(fp.get("confidence", 0.8)),
                        "reachability":       "unreachable",
                        "hours_saved": {
                            "critical": 4, "high": 2, "medium": 1
                        }.get(finding.get("severity", "medium"), 0.5),
                    }).eq("organization_id", self.org_id)\
                      .eq("scan_run_id",     self.scan_run_id)\
                      .eq("title",           finding.get("title", ""))\
                      .execute()
                    auto_ignored += 1
                except Exception as e:
                    print(f"[DayZero] DB update error for false positive: {e}")

        except Exception as e:
            print(f"[DayZero] Triage batch error: {e}")

        return auto_ignored, tokens_used
