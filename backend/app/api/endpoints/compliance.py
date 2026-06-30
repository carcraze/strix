"""
Compliance API Endpoints
Calculates real-time compliance posture from scan findings.
Maps issues to Kenya & UK regulatory frameworks.
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.core.security import get_current_user
from app.core.compliance_frameworks import (
    ALL_FRAMEWORKS,
    KENYA_FRAMEWORKS,
    UK_FRAMEWORKS,
    get_frameworks_by_region,
    calculate_compliance_score,
    map_finding_to_controls,
)
from app.services.supabase import supabase_admin

router = APIRouter(prefix="/api/compliance", tags=["compliance"])


@router.get("/frameworks")
async def list_frameworks(
    region: Optional[str] = Query(None, description="Filter by region: KE, UK, or ALL"),
    user=Depends(get_current_user),
):
    """List available compliance frameworks."""
    if region:
        frameworks = get_frameworks_by_region(region.upper())
    else:
        frameworks = list(ALL_FRAMEWORKS.values())

    # Return without the full controls list for the overview
    return [
        {
            "id": fw["id"],
            "name": fw["name"],
            "short_name": fw["short_name"],
            "region": fw["region"],
            "description": fw["description"],
            "authority": fw["authority"],
            "penalty_info": fw["penalty_info"],
            "total_controls": len(fw["controls"]),
        }
        for fw in frameworks
    ]


@router.get("/posture")
async def get_compliance_posture(
    org_id: str = Query(..., description="Organization ID"),
    region: Optional[str] = Query(None, description="Filter by region: KE, UK"),
    user=Depends(get_current_user),
):
    """
    Get real-time compliance posture for an organization.
    Calculates scores across all enabled frameworks based on current open issues.
    """
    # Fetch all open/in_progress issues for this org
    result = supabase_admin.table("issues") \
        .select("id, title, severity, scan_type, status") \
        .eq("organization_id", org_id) \
        .in_("status", ["open", "in_progress"]) \
        .execute()

    open_issues = result.data or []

    # Determine which frameworks to evaluate
    if region:
        fw_ids = KENYA_FRAMEWORKS if region.upper() == "KE" else UK_FRAMEWORKS
    else:
        fw_ids = list(ALL_FRAMEWORKS.keys())

    # Calculate score for each framework
    posture = []
    for fw_id in fw_ids:
        fw = ALL_FRAMEWORKS[fw_id]
        score_data = calculate_compliance_score(fw_id, open_issues)
        posture.append({
            "framework_id": fw_id,
            "framework_name": fw["name"],
            "short_name": fw["short_name"],
            "region": fw["region"],
            "authority": fw["authority"],
            "score": score_data["score"],
            "passing": score_data["passing"],
            "failing": score_data["failing"],
            "warning": score_data["warning"],
            "total_controls": score_data["total_controls"],
            "auto_checkable": score_data["auto_checkable"],
            "status": "passing" if score_data["score"] >= 80 else "warning" if score_data["score"] >= 50 else "failing",
        })

    # Overall scores
    ke_scores = [p["score"] for p in posture if p["region"] == "KE"]
    uk_scores = [p["score"] for p in posture if p["region"] == "UK"]

    return {
        "overall_score": int(sum(p["score"] for p in posture) / len(posture)) if posture else 0,
        "kenya_score": int(sum(ke_scores) / len(ke_scores)) if ke_scores else 0,
        "uk_score": int(sum(uk_scores) / len(uk_scores)) if uk_scores else 0,
        "total_open_issues": len(open_issues),
        "frameworks": posture,
    }


@router.get("/framework/{framework_id}")
async def get_framework_detail(
    framework_id: str,
    org_id: str = Query(..., description="Organization ID"),
    user=Depends(get_current_user),
):
    """
    Get detailed compliance status for a specific framework.
    Returns per-control pass/fail status with mapped issues.
    """
    fw = ALL_FRAMEWORKS.get(framework_id)
    if not fw:
        return {"error": "Framework not found"}

    # Fetch open issues
    result = supabase_admin.table("issues") \
        .select("id, title, severity, scan_type, status, file_path, found_at") \
        .eq("organization_id", org_id) \
        .in_("status", ["open", "in_progress"]) \
        .execute()

    open_issues = result.data or []
    score_data = calculate_compliance_score(framework_id, open_issues)

    return {
        "framework": {
            "id": fw["id"],
            "name": fw["name"],
            "short_name": fw["short_name"],
            "region": fw["region"],
            "description": fw["description"],
            "authority": fw["authority"],
            "penalty_info": fw["penalty_info"],
        },
        "score": score_data["score"],
        "passing": score_data["passing"],
        "failing": score_data["failing"],
        "warning": score_data["warning"],
        "total_controls": score_data["total_controls"],
        "controls": score_data["controls"],
    }


@router.get("/issue-mapping/{issue_id}")
async def get_issue_compliance_mapping(
    issue_id: str,
    user=Depends(get_current_user),
):
    """
    Get all compliance controls that a specific issue impacts.
    Useful for showing regulatory context on issue detail pages.
    """
    result = supabase_admin.table("issues") \
        .select("id, title, severity, scan_type") \
        .eq("id", issue_id) \
        .single() \
        .execute()

    if not result.data:
        return {"error": "Issue not found"}

    issue = result.data
    mappings = map_finding_to_controls(issue["scan_type"], issue["severity"])

    return {
        "issue_id": issue["id"],
        "issue_title": issue["title"],
        "severity": issue["severity"],
        "scan_type": issue["scan_type"],
        "compliance_impact": mappings,
        "frameworks_affected": list(set(m["framework_name"] for m in mappings)),
    }
