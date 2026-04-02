"""
Zentinel Code Scan API
Triggers Day Zero scans via Celery worker (NOT BackgroundTasks — Cloud Run pods
can be killed between requests; Celery worker on the VM runs until complete).
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
import uuid
import os
from datetime import datetime, timezone

import redis as redis_lib

from app.services.supabase import supabase_admin
from app.core.security import get_current_user, validate_uuid, verify_organization_access
from app.workers.tasks import run_day_zero_task   # Celery task
from app.core.config import settings

router = APIRouter(prefix="/api/code-scan", tags=["code_scan"])

# ─── GAP 5: Per-org rate limiter using Redis ──────────────────────────────────
# Max Day Zero scans per organization per hour.
# A Redis counter with a 1-hour TTL is the fastest, cheapest, most reliable
# approach — no DB round-trips, no memory leaks, survives Cloud Run restarts.
_DAY_ZERO_LIMIT_PER_HOUR = 5

def _get_redis() -> redis_lib.Redis:
    return redis_lib.from_url(
        getattr(settings, "REDIS_URL", os.environ.get("REDIS_URL", "redis://localhost:6379")),
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2,
    )

def _check_org_rate_limit(org_id: str) -> tuple[bool, int]:
    """Returns (allowed, current_count).

    Uses a Redis counter with a 1-hour sliding window per org.
    On any Redis error we ALLOW the request (fail open) — a Redis outage
    should not block legitimate founders from scanning their repos.
    """
    key = f"dayzero:rl:{org_id}"
    try:
        r = _get_redis()
        pipe = r.pipeline()
        pipe.incr(key)
        pipe.expire(key, 3600)   # reset after 1 hour
        results = pipe.execute()
        count = int(results[0])
        return count <= _DAY_ZERO_LIMIT_PER_HOUR, count
    except Exception as e:
        print(f"[RateLimit] Redis error (failing open): {e}")
        return True, 0   # fail open — Redis outage ≠ block user


class DayZeroRequest(BaseModel):
    organization_id: str
    repository_id: str
    repo_full_name: str        # "owner/repo"
    github_token: Optional[str] = None


@router.post("/day-zero")
async def trigger_day_zero_scan(
    payload: DayZeroRequest,
    user=Depends(get_current_user)
):
    """Trigger the Day Zero onboarding scan for a newly connected repository.

    Dispatches to Celery worker via Redis — runs on zentinel-worker-1 VM,
    not in this Cloud Run pod. Returns immediately with scan_run_id for polling.
    """
    validate_uuid(payload.organization_id, "organization_id")
    validate_uuid(payload.repository_id,  "repository_id")

    user_id = user.get("sub")
    if not verify_organization_access(user_id, payload.organization_id):
        raise HTTPException(403, "Access denied")

    # ── GAP 5: Rate limit — max 5 Day Zero scans per org per hour ────────────
    allowed, current_count = _check_org_rate_limit(payload.organization_id)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limit_exceeded",
                "message": (
                    f"Your organization has triggered {current_count} Day Zero scans "
                    f"in the last hour (limit: {_DAY_ZERO_LIMIT_PER_HOUR}). "
                    "Please wait before re-triggering, or contact support for higher limits."
                ),
                "retry_after_seconds": 3600,
            },
        )

    # Create scan_run record before dispatching
    scan_run_id = str(uuid.uuid4())
    supabase_admin.table("scan_runs").insert({
        "id":              scan_run_id,
        "organization_id": payload.organization_id,
        "repository_id":   payload.repository_id,
        "scan_type":       "day_zero",
        "status":          "pending",
        "started_at":      datetime.utcnow().isoformat(),
    }).execute()

    # Dispatch to Celery worker via Redis — survives Cloud Run idle timeouts
    run_day_zero_task.apply_async(
        kwargs={
            "org_id":         payload.organization_id,
            "repo_id":        payload.repository_id,
            "repo_full_name": payload.repo_full_name,
            "scan_run_id":    scan_run_id,
            "github_token":   payload.github_token,
        },
        queue="scans",   # same queue the worker is listening on
    )

    return {
        "scan_run_id": scan_run_id,
        "status":      "queued",
        "message":     f"Day Zero scan queued for {payload.repo_full_name}. Poll /scan-status/{scan_run_id} for progress.",
    }


@router.get("/scan-status/{scan_run_id}")
async def get_scan_status(scan_run_id: str, user=Depends(get_current_user)):
    """Poll scan run status. Frontend polls this until status = completed | failed."""
    validate_uuid(scan_run_id, "scan_run_id")

    data = supabase_admin.table("scan_runs")\
        .select("id, status, findings_count, auto_ignored_count, hours_saved, started_at, completed_at, error_message, repositories(full_name)")\
        .eq("id", scan_run_id)\
        .single()\
        .execute()

    if not data.data:
        raise HTTPException(404, "Scan run not found")

    return data.data


@router.get("/scan-runs/{org_id}")
async def get_scan_runs(org_id: str, user=Depends(get_current_user)):
    """Get all scan runs for an organization (most recent first)."""
    validate_uuid(org_id, "org_id")
    if not verify_organization_access(user.get("sub"), org_id):
        raise HTTPException(403, "Access denied")

    data = supabase_admin.table("scan_runs")\
        .select("*, repositories(full_name)")\
        .eq("organization_id", org_id)\
        .order("started_at", desc=True)\
        .limit(20)\
        .execute()

    return {"scan_runs": data.data}


@router.get("/findings/{org_id}")
async def get_code_scan_findings(
    org_id:      str,
    scan_type:   Optional[str] = None,
    scan_run_id: Optional[str] = None,
    user=Depends(get_current_user)
):
    """Return all code scan findings (SCA/SAST/IaC/secrets/license) for an org.
    Excludes pentest findings — those live in the Issues feed separately.
    """
    validate_uuid(org_id, "org_id")
    if not verify_organization_access(user.get("sub"), org_id):
        raise HTTPException(403, "Access denied")

    query = supabase_admin.table("issues")\
        .select("*, repositories(full_name)")\
        .eq("organization_id", org_id)\
        .not_("scan_type", "eq", "pentest")\
        .not_("scan_type", "is", "null")

    if scan_type:
        query = query.eq("scan_type", scan_type)
    if scan_run_id:
        query = query.eq("scan_run_id", scan_run_id)

    data = query\
        .order("severity", desc=False)\
        .limit(1000)\
        .execute()   # No 200-cap — return everything

    # Group by scan_type for tab counts
    grouped: dict[str, list] = {}
    for issue in (data.data or []):
        st = issue.get("scan_type", "sca")
        grouped.setdefault(st, []).append(issue)

    return {
        "total":    len(data.data or []),
        "by_type":  {k: len(v) for k, v in grouped.items()},
        "findings": data.data,
    }
