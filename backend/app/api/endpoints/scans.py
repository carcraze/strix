from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..core.scan_types import ScanType, SCAN_CONFIGS, PLAN_SCAN_PERMISSIONS
from ..services.supabase import supabase_admin
from ..workers.tasks import run_pentest_task
from ..core.security import get_current_user

router = APIRouter(prefix="/api/scans", tags=["scans"])

class ScanRequest(BaseModel):
    organization_id: str
    name: Optional[str] = None
    scan_type: ScanType
    domains: list[str]
    repos: list[dict]                       # [{"full_name": "org/repo", "branch": "main"}]
    # Context (all optional — shown in wizard Step 3)
    app_description: Optional[str] = None
    tech_stack: Optional[str] = None
    auth_details: Optional[str] = None
    sensitive_data: Optional[str] = None
    testing_focus: Optional[str] = None
    compliance_framework: Optional[str] = None  # 'soc2' | 'iso27001'
    api_endpoints: Optional[str] = None
    # Access (optional — wizard Step 4)
    credentials: Optional[list[dict]] = None    # [{"username": "x", "password": "y"}]
    custom_headers: Optional[list[dict]] = None # [{"name": "Authorization", "value": "Bearer ..."}]

@router.post("/launch")
async def launch_scan(payload: ScanRequest, user=Depends(get_current_user)):
    org_id = payload.organization_id
    scan_type = payload.scan_type
    config = SCAN_CONFIGS[scan_type]
    credit_type = scan_type.value  # "quick" | "web_api" | "full_stack" | "compliance"

    # ── GATE 1: FETCH ORG ────────────────────────────────────────
    org = supabase_admin.table("organizations") \
        .select("plan, scan_credits") \
        .eq("id", org_id).single().execute().data

    if not org:
        raise HTTPException(404, "Organization not found")

    plan = org["plan"] or "free"
    scan_credits = org.get("scan_credits") or {}
    credit_source = None

    # ── GATE 2: DETERMINE CREDIT SOURCE ─────────────────────────
    # One-time credits take priority over subscription
    if scan_credits.get(credit_type, 0) > 0:
        credit_source = "one_time"

    elif plan in PLAN_SCAN_PERMISSIONS:
        plan_perms = PLAN_SCAN_PERMISSIONS[plan]

        # Check scan type allowed on this plan
        if scan_type not in plan_perms["allowed_types"]:
            raise HTTPException(403, detail={
                "error": f"{config.label} is not available on your {plan.title()} plan.",
                "upgrade_required": True,
                "suggested_plan": _suggest_upgrade(plan, scan_type),
            })

        # Check monthly limit (Starter: 3/mo, Growth/Scale: None = unlimited)
        if plan_perms["monthly_limit"] is not None:
            current_month = datetime.now().strftime("%Y-%m")
            usage_rows = supabase_admin.table("scan_usage") \
                .select("scans_used") \
                .eq("organization_id", org_id) \
                .eq("month", current_month) \
                .execute().data
            used = usage_rows[0]["scans_used"] if usage_rows else 0

            if used >= plan_perms["monthly_limit"]:
                raise HTTPException(403, detail={
                    "error": f"You've used all {plan_perms['monthly_limit']} scans for this month.",
                    "upgrade_required": True,
                    "suggested_plan": "growth",
                })

        credit_source = "subscription"

    else:
        raise HTTPException(403, detail={
            "error": "No active plan or credits. Subscribe or purchase a scan to continue.",
            "upgrade_required": True,
        })

    # ── GATE 3: ENFORCE TARGET LIMITS ───────────────────────────
    if credit_source == "one_time":
        # One-time credits have fixed limits per scan type
        if len(payload.domains) > config.max_domains:
            raise HTTPException(400, f"{config.label} allows {config.max_domains} domain. Remove extras.")
        if not config.allow_repos and len(payload.repos) > 0:
            raise HTTPException(400, f"{config.label} is domain/API only. Remove repositories, or upgrade to Full Stack Scan ($199).")
        if config.allow_repos and len(payload.repos) > config.max_repos:
            raise HTTPException(400, f"{config.label} allows {config.max_repos} repository.")
    else:
        plan_perms = PLAN_SCAN_PERMISSIONS[plan]
        if len(payload.domains) > plan_perms["max_domains_per_scan"]:
            raise HTTPException(400, f"Your {plan} plan allows {plan_perms['max_domains_per_scan']} domains per scan.")
        if len(payload.repos) > plan_perms["max_repos_per_scan"]:
            raise HTTPException(400, f"Your {plan} plan allows {plan_perms['max_repos_per_scan']} repos per scan.")

    # ── GATE 4: CONSUME CREDIT ───────────────────────────────────
    if credit_source == "one_time":
        # Atomic decrement — safe against race conditions via row lock in SQL function
        result = supabase_admin.rpc("decrement_scan_credit", {
            "org_id": org_id,
            "credit_type": credit_type,
        }).execute()
        if not result.data:
            raise HTTPException(403, "Credit no longer available. Please refresh and try again.")
    else:
        current_month = datetime.now().strftime("%Y-%m")
        supabase_admin.rpc("increment_scan_usage", {
            "org_id": org_id,
            "month": current_month,
        }).execute()

    # ── CREATE PENTEST RECORD ────────────────────────────────────
    effective_scan_mode = (
        config.scan_mode  # one-time scan always uses its defined mode
        if credit_source == "one_time"
        else PLAN_SCAN_PERMISSIONS[plan]["scan_mode"]  # subscription uses plan mode
    )

    pentest = supabase_admin.table("pentests").insert({
        "organization_id": org_id,
        "name": payload.name or f"{payload.domains[0] if payload.domains else 'scan'} — {datetime.now().strftime('%b %d %Y')}",
        "type": "whitebox" if (payload.repos and config.allow_repos) else "blackbox",
        "scan_type": scan_type.value,
        "scan_mode": effective_scan_mode,
        "status": "pending",
        "credit_source": credit_source,
        "app_context": _build_context_string(payload),
        "testing_focus": payload.testing_focus,
        "compliance_framework": payload.compliance_framework,
        "context_provided": bool(payload.app_description),
        "credentials": payload.credentials,
        "custom_headers": payload.custom_headers,
    }).execute().data[0]

    pentest_id = pentest["id"]

    # Insert targets
    targets = []
    for domain in payload.domains[:config.max_domains]:
        targets.append({"pentest_id": pentest_id, "target_type": "domain", "domain_url": domain})
    if config.allow_repos:
        for repo in payload.repos[:config.max_repos]:
            targets.append({
                "pentest_id": pentest_id,
                "target_type": "repository",
                "repo_full_name": repo["full_name"],
                "repo_branch": repo.get("branch", "main"),
            })
    if targets:
        supabase_admin.table("pentest_targets").insert(targets).execute()

    # ── FIRE CELERY TASK ─────────────────────────────────────────
    run_pentest_task.delay(
        pentest_id=pentest_id,
        org_id=org_id,
        scan_type=scan_type.value,
        domains=payload.domains[:config.max_domains],
        repos=[r["full_name"] for r in payload.repos[:config.max_repos]] if config.allow_repos else [],
        context=_build_context_string(payload),
        credentials=payload.credentials or [],
        custom_headers=payload.custom_headers or [],
        credit_source=credit_source,
        compliance_framework=payload.compliance_framework,
        generate_pdf=config.generate_pdf,
        scan_mode=effective_scan_mode,
    )

    return {
        "pentest_id": pentest_id,
        "message": "Scan launched",
        "scan_type": scan_type.value,
        "credit_source": credit_source,
    }

def _build_context_string(payload: ScanRequest) -> str:
    parts = []
    if payload.app_description: parts.append(f"Application: {payload.app_description}")
    if payload.tech_stack:      parts.append(f"Tech stack: {payload.tech_stack}")
    if payload.auth_details:    parts.append(f"Authentication: {payload.auth_details}")
    if payload.api_endpoints:   parts.append(f"Key API endpoints: {payload.api_endpoints}")
    if payload.sensitive_data:  parts.append(f"Sensitive data: {payload.sensitive_data}")
    if payload.testing_focus:   parts.append(f"Focus on: {payload.testing_focus}")
    return ". ".join(parts)

def _suggest_upgrade(current_plan: str, scan_type: ScanType) -> str:
    if scan_type == ScanType.FULL_STACK and current_plan in ["free", "starter"]:
        return "growth"
    if scan_type == ScanType.COMPLIANCE and current_plan in ["free", "starter", "growth"]:
        return "scale"
    return "growth"
