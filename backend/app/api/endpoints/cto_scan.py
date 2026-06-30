"""
CTO Super Admin Scan Endpoint
Bypasses all credit, plan, domain verification checks.
Pipeline: Katana Recon → Strix Deep Pentest
Only accessible by CTO user: 03a2932b-4f96-4698-bab9-9e1829e2232a
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import json

from app.core.security import get_current_user, validate_uuid
from app.services.supabase import supabase_admin
from app.services.redis_service import subscribe_to_channel
from app.workers.tasks import run_pentest_task, celery_app
from app.workers.katana_task import run_katana_recon, build_strix_context_from_katana

router = APIRouter(prefix="/api/cto", tags=["cto"])

CTO_UID = "03a2932b-4f96-4698-bab9-9e1829e2232a"


def require_cto(user=Depends(get_current_user)):
    """Guard: only CTO can access these endpoints."""
    user_id = user.get("sub")
    if user_id != CTO_UID:
        raise HTTPException(404, "Not found")
    return user


class CTOScanRequest(BaseModel):
    report_id: str
    project_id: str
    name: str
    domains: list[str]
    repos: list[dict]  # [{"full_name": "org/repo", "branch": "main"}]
    strix_instruction: str
    app_description: Optional[str] = None
    testing_focus: Optional[str] = None
    credentials: Optional[list[dict]] = None
    custom_headers: Optional[list[dict]] = None
    # Katana config
    katana_depth: int = 5
    katana_headless: bool = True
    katana_duration: str = "10m"


@router.post("/launch-scan")
async def cto_launch_scan(payload: CTOScanRequest, user=Depends(require_cto)):
    """
    Launch full CTO pentest pipeline:
    Phase 1: Katana recon (crawl all endpoints, subdomains, JS, forms, secrets)
    Phase 2: Strix deep pentest (uses Katana output as enriched context)

    Streams real-time logs via Redis → SSE at /api/cto/scan/{report_id}/logs
    """
    validate_uuid(payload.report_id, "report_id")
    validate_uuid(payload.project_id, "project_id")

    # Create pentest record
    pentest = supabase_admin.table("pentests").insert({
        "organization_id": None,
        "name": payload.name,
        "type": "whitebox" if payload.repos else "blackbox",
        "scan_type": "deep",
        "scan_mode": "deep",
        "status": "pending",
        "credit_source": "cto_bypass",
        "app_context": payload.app_description or "",
        "testing_focus": payload.testing_focus or "Full offensive pentest - all attack vectors",
        "context_provided": True,
        "credentials": payload.credentials,
        "custom_headers": payload.custom_headers,
        "strix_instruction": payload.strix_instruction,
    }).execute().data[0]

    pentest_id = pentest["id"]

    # Link report to pentest
    supabase_admin.table("cto_scan_reports").update({
        "pentest_id": pentest_id,
        "status": "running",
    }).eq("id", payload.report_id).execute()

    # Update project status
    supabase_admin.table("cto_projects").update({
        "status": "scanning",
        "updated_at": datetime.now().isoformat(),
    }).eq("id", payload.project_id).execute()

    # Insert targets
    targets = []
    for domain in payload.domains:
        targets.append({"pentest_id": pentest_id, "target_type": "domain", "domain_url": domain})
    for repo in payload.repos:
        targets.append({
            "pentest_id": pentest_id,
            "target_type": "repository",
            "repo_full_name": repo["full_name"],
            "repo_branch": repo.get("branch", "main"),
        })
    if targets:
        supabase_admin.table("pentest_targets").insert(targets).execute()

    # Dispatch Celery task for full pipeline (Katana → Strix)
    run_cto_pipeline.delay(
        report_id=payload.report_id,
        pentest_id=pentest_id,
        project_id=payload.project_id,
        name=payload.name,
        domains=payload.domains,
        repos=[r["full_name"] for r in payload.repos],
        strix_instruction=payload.strix_instruction,
        app_description=payload.app_description or "",
        testing_focus=payload.testing_focus or "",
        credentials=payload.credentials or [],
        custom_headers=payload.custom_headers or [],
        katana_depth=payload.katana_depth,
        katana_headless=payload.katana_headless,
        katana_duration=payload.katana_duration,
    )

    return {
        "pentest_id": pentest_id,
        "report_id": payload.report_id,
        "status": "launched",
        "message": "Full pipeline launched: Katana recon → Strix pentest",
    }


@router.get("/scan/{report_id}/logs")
async def stream_cto_scan_logs(report_id: str, user=Depends(require_cto)):
    """SSE stream for CTO scan logs (Katana + Strix phases)."""
    validate_uuid(report_id, "report_id")

    channel = f"cto_scan:{report_id}:logs"

    async def event_generator():
        async for message in subscribe_to_channel(channel):
            yield f"data: {json.dumps(message)}\n\n"
            # Close stream when scan finishes
            msg_type = message.get("type", "")
            status = message.get("data", {}).get("status", "")
            if msg_type == "status" and status in ("completed", "failed"):
                break

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/inject-context/{report_id}")
async def inject_context(report_id: str, request: Request, user=Depends(require_cto)):
    """
    Inject additional context into a running scan.
    Publishes to the Redis channel so Strix picks it up.
    """
    validate_uuid(report_id, "report_id")
    body = await request.json()
    context = body.get("context", "")

    channel = f"cto_scan:{report_id}:logs"
    publish_event_sync(channel, "context_inject", {
        "message": f"[CTO] Injected context: {context[:200]}",
        "full_context": context,
    })

    return {"status": "injected", "message": "Context published to scan channel"}


@router.get("/projects")
async def get_cto_projects(user=Depends(require_cto)):
    """Get all CTO pentest projects."""
    result = supabase_admin.table("cto_projects") \
        .select("*") \
        .order("created_at", desc=True) \
        .execute()
    return result.data


@router.get("/reports/{project_id}")
async def get_cto_reports(project_id: str, user=Depends(require_cto)):
    """Get all reports for a CTO project."""
    validate_uuid(project_id, "project_id")
    result = supabase_admin.table("cto_scan_reports") \
        .select("*") \
        .eq("project_id", project_id) \
        .order("created_at", desc=True) \
        .execute()
    return result.data


# ─── Celery Task: Full CTO Pipeline ──────────────────────────────────────────

@celery_app.task(bind=True, name="run_cto_pipeline", max_retries=0, queue="scans")
def run_cto_pipeline(
    self,
    report_id: str,
    pentest_id: str,
    project_id: str,
    name: str,
    domains: list[str],
    repos: list[str],
    strix_instruction: str,
    app_description: str,
    testing_focus: str,
    credentials: list[dict],
    custom_headers: list[dict],
    katana_depth: int = 5,
    katana_headless: bool = True,
    katana_duration: str = "10m",
):
    """
    Full CTO pipeline executed by Celery worker:
    1. Katana recon (crawl, discover endpoints, tech, secrets)
    2. Build enriched Strix instruction from Katana output
    3. Run Strix deep pentest with full attack surface knowledge
    """
    import time
    from app.services.redis_service import publish_event

    redis_channel = f"cto_scan:{report_id}:logs"
    scan_start = time.time()

    publish_event(redis_channel, "status", {
        "status": "running",
        "message": "🚀 CTO Pipeline started — Phase 1: Katana Recon",
        "phase": "recon",
    })

    # ── PHASE 1: KATANA RECON ─────────────────────────────────────────────────
    katana_output = {}
    if domains:
        try:
            header_list = None
            if custom_headers:
                header_list = [f"{h.get('name', '')}: {h.get('value', '')}" for h in custom_headers if h.get('name')]

            katana_output = run_katana_recon(
                report_id=report_id,
                domains=domains,
                redis_channel=redis_channel,
                headless=katana_headless,
                depth=katana_depth,
                crawl_duration=katana_duration,
                custom_headers=header_list,
            )
        except Exception as e:
            publish_event(redis_channel, "log", {
                "type": "error",
                "message": f"[KATANA] Recon failed: {str(e)[:300]}. Proceeding to Strix without enrichment.",
                "timestamp": time.time(),
            })

    # ── PHASE 2: STRIX PENTEST ────────────────────────────────────────────────
    publish_event(redis_channel, "status", {
        "status": "running",
        "message": "🗡️ Phase 2: Strix Deep Pentest — all specialists deployed",
        "phase": "pentest",
    })

    # Build enriched instruction with Katana output
    katana_context = ""
    if katana_output:
        katana_context = build_strix_context_from_katana(katana_output, app_description)

    enriched_instruction = f"{strix_instruction}\n\n{katana_context}"

    publish_event(redis_channel, "log", {
        "type": "action",
        "message": f"[STRIX] Launching deep pentest with {len(katana_output.get('endpoints', []))} enriched endpoints",
        "timestamp": time.time(),
    })

    # Fire existing Strix pentest task (reuse the proven pipeline)
    # We call it synchronously here so we stay in the same Celery context
    # and can update the report when done
    try:
        run_pentest_task(
            pentest_id=pentest_id,
            org_id="cto-bypass",
            scan_type="deep",
            domains=domains,
            repos=repos,
            context=enriched_instruction,
            strix_instruction=enriched_instruction,
            credentials=credentials,
            custom_headers=custom_headers,
            credit_source="cto_bypass",
            compliance_framework=None,
            generate_pdf=True,
            scan_mode="deep",
        )
    except Exception as e:
        publish_event(redis_channel, "log", {
            "type": "error",
            "message": f"[STRIX] Pentest error: {str(e)[:300]}",
            "timestamp": time.time(),
        })

    # ── FINALIZE ──────────────────────────────────────────────────────────────
    duration = int(time.time() - scan_start)

    # Fetch pentest results
    pentest_data = supabase_admin.table("pentests") \
        .select("final_report, issues_found, status") \
        .eq("id", pentest_id).single().execute().data

    # Update CTO report
    supabase_admin.table("cto_scan_reports").update({
        "status": "completed" if pentest_data.get("status") == "completed" else "failed",
        "report_markdown": pentest_data.get("final_report"),
        "duration_seconds": duration,
        "completed_at": datetime.now().isoformat(),
        "findings_summary": _count_findings(pentest_id),
    }).eq("id", report_id).execute()

    # Update project status
    supabase_admin.table("cto_projects").update({
        "status": "completed",
        "updated_at": datetime.now().isoformat(),
    }).eq("id", project_id).execute()

    publish_event(redis_channel, "status", {
        "status": "completed",
        "message": f"✅ Full pipeline complete — {duration}s total",
        "duration": duration,
    })


def _count_findings(pentest_id: str) -> dict:
    """Count findings by severity for a pentest."""
    try:
        result = supabase_admin.table("issues") \
            .select("severity") \
            .eq("pentest_id", pentest_id).execute()
        counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for row in result.data or []:
            sev = row.get("severity", "").lower()
            if sev in counts:
                counts[sev] += 1
        return counts
    except Exception:
        return {"critical": 0, "high": 0, "medium": 0, "low": 0}


def publish_event_sync(channel: str, event_type: str, data: dict):
    """Sync publish for use in async FastAPI context."""
    from app.services.redis_service import publish_event
    publish_event(channel, event_type, data)
