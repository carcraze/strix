"""
CTO Super Admin Scan Endpoint
Bypasses all credit, plan, domain verification checks.
Only accessible by CTO user: 03a2932b-4f96-4698-bab9-9e1829e2232a
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.security import get_current_user, validate_uuid
from app.services.supabase import supabase_admin
from app.workers.tasks import run_pentest_task

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


@router.post("/launch-scan")
async def cto_launch_scan(payload: CTOScanRequest, user=Depends(require_cto)):
    """
    Launch a full pentest scan with zero restrictions.
    - No credit check
    - No plan check
    - No domain verification
    - No rate limiting
    - Deep mode, all specialists, maximum timeout
    """
    validate_uuid(payload.report_id, "report_id")
    validate_uuid(payload.project_id, "project_id")

    # Create pentest record (uses CTO's own org or creates an unlinked one)
    pentest = supabase_admin.table("pentests").insert({
        "organization_id": None,  # CTO scans are org-independent
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

    # Fire Celery task — deep mode, all specialists, no limits
    run_pentest_task.delay(
        pentest_id=pentest_id,
        org_id="cto-bypass",
        scan_type="deep",
        domains=payload.domains,
        repos=[r["full_name"] for r in payload.repos],
        context=payload.app_description or f"Full offensive pentest for {payload.name}",
        strix_instruction=payload.strix_instruction,
        credentials=payload.credentials or [],
        custom_headers=payload.custom_headers or [],
        credit_source="cto_bypass",
        compliance_framework=None,
        generate_pdf=True,
        scan_mode="deep",
    )

    return {
        "pentest_id": pentest_id,
        "report_id": payload.report_id,
        "status": "launched",
        "message": "Full offensive scan launched — no restrictions",
    }


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
