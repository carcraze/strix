"""
Katana Recon Task — CTO Panel
Runs Katana crawling as Phase 1 of the CTO pentest pipeline.
Streams results via Redis PubSub for live viewing.
"""
import asyncio
import json
import subprocess
import os
import tempfile
import logging
from typing import Optional

from app.services.redis_service import publish_event
from app.services.supabase import supabase_admin

logger = logging.getLogger(__name__)

# Katana binary — installed on worker VM via `go install`
KATANA_BIN = os.environ.get("KATANA_BIN", "katana")


def run_katana_recon(
    report_id: str,
    domains: list[str],
    redis_channel: str,
    headless: bool = True,
    depth: int = 5,
    js_crawl: bool = True,
    tech_detect: bool = True,
    form_fill: bool = True,
    knowledge_base: bool = True,
    crawl_duration: str = "10m",
    custom_headers: Optional[list[str]] = None,
) -> dict:
    """
    Run Katana recon on target domains.
    Streams discovered endpoints to Redis in real-time.
    Returns structured output (endpoints, tech, forms, secrets).

    This runs synchronously inside a Celery task.
    """
    publish_event(redis_channel, "phase", {
        "phase": "recon",
        "status": "starting",
        "message": f"🕷️ Katana recon starting — crawling {len(domains)} domain(s)",
        "domains": domains,
    })

    all_results = {
        "endpoints": [],
        "js_files": [],
        "forms": [],
        "technologies": set(),
        "parameters": [],
        "subdomains": set(),
        "secrets": [],
        "total_pages": 0,
    }

    for domain in domains:
        domain_url = domain if domain.startswith("http") else f"https://{domain}"

        publish_event(redis_channel, "log", {
            "type": "action",
            "message": f"[KATANA] Crawling {domain_url} (depth={depth}, headless={headless})",
            "timestamp": _now(),
        })

        # Build Katana command
        cmd = [
            KATANA_BIN,
            "-u", domain_url,
            "-d", str(depth),
            "-jsonl",
            "-silent",
            "-ct", crawl_duration,
            "-td",  # tech detect
            "-jc",  # JS crawl
            "-kf", "all",  # robots.txt + sitemap
            "-fsu",  # filter similar URLs
            "-rl", "100",  # rate limit
            "-c", "15",  # concurrency
            "-timeout", "15",
        ]

        if headless:
            cmd.extend(["-headless", "-no-sandbox"])

        if form_fill:
            cmd.append("-aff")

        if knowledge_base:
            cmd.extend(["-kb", "-kb-secrets", "-kb-endpoints"])

        if custom_headers:
            for header in custom_headers:
                cmd.extend(["-H", header])

        # Run Katana and stream output line by line
        try:
            publish_event(redis_channel, "log", {
                "type": "info",
                "message": f"[KATANA] Command: {' '.join(cmd[:8])}... ({len(cmd)} args)",
                "timestamp": _now(),
            })

            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,  # line buffered
            )

            endpoint_count = 0

            for line in iter(process.stdout.readline, ''):
                line = line.strip()
                if not line:
                    continue

                endpoint_count += 1

                # Try to parse JSONL output
                try:
                    entry = json.loads(line)
                    url = entry.get("request", {}).get("endpoint", line)
                    resp = entry.get("response", {})
                    techs = resp.get("technologies", [])
                    kb = resp.get("knowledgebase", {})
                    status_code = resp.get("status_code", 0)

                    all_results["endpoints"].append(url)

                    # Collect technologies
                    for tech in techs:
                        all_results["technologies"].add(tech)

                    # Detect JS files
                    if url.endswith(".js") or "/js/" in url:
                        all_results["js_files"].append(url)

                    # Detect forms
                    forms = kb.get("Forms", [])
                    if forms:
                        all_results["forms"].extend(forms)

                    # Detect secrets
                    secrets = kb.get("secrets", [])
                    if secrets:
                        all_results["secrets"].extend(secrets)

                    # Detect subdomains
                    from urllib.parse import urlparse
                    parsed = urlparse(url)
                    if parsed.hostname:
                        all_results["subdomains"].add(parsed.hostname)

                    # Stream significant finds to frontend
                    if endpoint_count <= 200 or endpoint_count % 50 == 0:
                        publish_event(redis_channel, "log", {
                            "type": "info",
                            "message": f"[KATANA] [{endpoint_count}] {url}" + (f" | Tech: {', '.join(techs)}" if techs else ""),
                            "timestamp": _now(),
                        })

                    # Stream findings (secrets, forms)
                    if secrets:
                        for secret in secrets:
                            publish_event(redis_channel, "log", {
                                "type": "finding",
                                "message": f"[KATANA] 🔑 Secret found: {secret}",
                                "timestamp": _now(),
                            })

                    if forms:
                        for form in forms:
                            publish_event(redis_channel, "log", {
                                "type": "info",
                                "message": f"[KATANA] 📝 Form detected: {form.get('type', 'unknown')} ({url})",
                                "timestamp": _now(),
                            })

                except json.JSONDecodeError:
                    # Plain text output (fallback)
                    all_results["endpoints"].append(line)
                    if endpoint_count <= 100 or endpoint_count % 25 == 0:
                        publish_event(redis_channel, "log", {
                            "type": "info",
                            "message": f"[KATANA] [{endpoint_count}] {line}",
                            "timestamp": _now(),
                        })

            process.wait(timeout=60)

            # Read stderr for any errors
            stderr_output = process.stderr.read()
            if stderr_output and "error" in stderr_output.lower():
                publish_event(redis_channel, "log", {
                    "type": "error",
                    "message": f"[KATANA] Warning: {stderr_output[:500]}",
                    "timestamp": _now(),
                })

            all_results["total_pages"] += endpoint_count

            publish_event(redis_channel, "log", {
                "type": "action",
                "message": f"[KATANA] ✅ {domain} complete — {endpoint_count} endpoints found",
                "timestamp": _now(),
            })

        except FileNotFoundError:
            publish_event(redis_channel, "log", {
                "type": "error",
                "message": f"[KATANA] ❌ Katana binary not found at '{KATANA_BIN}'. Install: go install github.com/projectdiscovery/katana/cmd/katana@latest",
                "timestamp": _now(),
            })
        except subprocess.TimeoutExpired:
            process.kill()
            publish_event(redis_channel, "log", {
                "type": "error",
                "message": f"[KATANA] ⏱️ Timeout reached for {domain}. Moving on.",
                "timestamp": _now(),
            })
        except Exception as e:
            publish_event(redis_channel, "log", {
                "type": "error",
                "message": f"[KATANA] Error crawling {domain}: {str(e)[:200]}",
                "timestamp": _now(),
            })

    # Convert sets to lists for JSON serialization
    all_results["technologies"] = list(all_results["technologies"])
    all_results["subdomains"] = list(all_results["subdomains"])

    # Summary
    summary = {
        "total_endpoints": len(all_results["endpoints"]),
        "total_js_files": len(all_results["js_files"]),
        "total_forms": len(all_results["forms"]),
        "total_technologies": len(all_results["technologies"]),
        "total_subdomains": len(all_results["subdomains"]),
        "total_secrets": len(all_results["secrets"]),
        "total_pages": all_results["total_pages"],
    }

    publish_event(redis_channel, "phase", {
        "phase": "recon",
        "status": "completed",
        "message": f"🕷️ Katana recon complete — {summary['total_endpoints']} endpoints, {summary['total_subdomains']} subdomains, {summary['total_technologies']} technologies detected",
        "summary": summary,
    })

    publish_event(redis_channel, "log", {
        "type": "action",
        "message": f"[KATANA] === RECON SUMMARY ===",
        "timestamp": _now(),
    })
    publish_event(redis_channel, "log", {
        "type": "info",
        "message": f"[KATANA] Endpoints: {summary['total_endpoints']} | JS Files: {summary['total_js_files']} | Forms: {summary['total_forms']}",
        "timestamp": _now(),
    })
    publish_event(redis_channel, "log", {
        "type": "info",
        "message": f"[KATANA] Subdomains: {', '.join(all_results['subdomains'][:20])}{'...' if len(all_results['subdomains']) > 20 else ''}",
        "timestamp": _now(),
    })
    publish_event(redis_channel, "log", {
        "type": "info",
        "message": f"[KATANA] Technologies: {', '.join(all_results['technologies'][:15])}{'...' if len(all_results['technologies']) > 15 else ''}",
        "timestamp": _now(),
    })

    # Store Katana output in the report
    supabase_admin.table("cto_scan_reports").update({
        "katana_output": {
            "summary": summary,
            "subdomains": all_results["subdomains"][:100],
            "technologies": all_results["technologies"],
            "js_files": all_results["js_files"][:200],
            "forms": all_results["forms"][:50],
            "secrets": all_results["secrets"][:50],
            "endpoints_sample": all_results["endpoints"][:500],
        },
    }).eq("id", report_id).execute()

    return all_results


def build_strix_context_from_katana(katana_output: dict, custom_context: str = "") -> str:
    """
    Build enriched context string for Strix from Katana results.
    This gives the AI agents precise attack surface info.
    """
    parts = []

    parts.append("## ATTACK SURFACE (from Katana Recon)")
    parts.append("")

    if katana_output.get("subdomains"):
        parts.append(f"### Discovered Subdomains ({len(katana_output['subdomains'])})")
        for sub in katana_output["subdomains"][:30]:
            parts.append(f"- {sub}")
        parts.append("")

    if katana_output.get("technologies"):
        parts.append(f"### Detected Technologies")
        parts.append(", ".join(katana_output["technologies"]))
        parts.append("")

    if katana_output.get("endpoints"):
        # Group interesting endpoints
        api_endpoints = [e for e in katana_output["endpoints"] if "/api/" in e or "/v1/" in e or "/v2/" in e or "/graphql" in e]
        auth_endpoints = [e for e in katana_output["endpoints"] if any(k in e.lower() for k in ["login", "auth", "sign", "token", "oauth", "session", "register"])]
        admin_endpoints = [e for e in katana_output["endpoints"] if any(k in e.lower() for k in ["admin", "dashboard", "manage", "panel", "internal"])]

        if api_endpoints:
            parts.append(f"### API Endpoints ({len(api_endpoints)} found)")
            for ep in api_endpoints[:50]:
                parts.append(f"- {ep}")
            parts.append("")

        if auth_endpoints:
            parts.append(f"### Authentication Endpoints ({len(auth_endpoints)} found)")
            for ep in auth_endpoints[:20]:
                parts.append(f"- {ep}")
            parts.append("")

        if admin_endpoints:
            parts.append(f"### Admin/Internal Endpoints ({len(admin_endpoints)} found)")
            for ep in admin_endpoints[:20]:
                parts.append(f"- {ep}")
            parts.append("")

        parts.append(f"### All Discovered Endpoints ({len(katana_output['endpoints'])} total)")
        parts.append(f"First 100 endpoints for reference:")
        for ep in katana_output["endpoints"][:100]:
            parts.append(f"- {ep}")
        parts.append("")

    if katana_output.get("js_files"):
        parts.append(f"### JavaScript Files ({len(katana_output['js_files'])} found)")
        for js in katana_output["js_files"][:30]:
            parts.append(f"- {js}")
        parts.append("")

    if katana_output.get("forms"):
        parts.append(f"### Forms Detected ({len(katana_output['forms'])} found)")
        for form in katana_output["forms"][:20]:
            parts.append(f"- Type: {form.get('type', 'unknown')}, Fields: {form.get('fields', {})}")
        parts.append("")

    if katana_output.get("secrets"):
        parts.append(f"### ⚠️ Secrets/Keys Found ({len(katana_output['secrets'])} found)")
        for secret in katana_output["secrets"][:10]:
            parts.append(f"- {secret}")
        parts.append("")

    if custom_context:
        parts.append("## ADDITIONAL CONTEXT (from CTO)")
        parts.append(custom_context)
        parts.append("")

    return "\n".join(parts)


def _now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()
