from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import json
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.workers.pr_task import run_pr_review_task
from app.services.redis_service import subscribe_to_channel
from app.services.supabase import supabase_admin
from app.core.security import get_current_user, validate_uuid, verify_organization_access

router = APIRouter(prefix="/api/pr-reviews", tags=["pr-reviews"])
limiter = Limiter(key_func=get_remote_address)

class PRReviewLaunchRequest(BaseModel):
    organization_id: str
    repository_id: str
    pr_review_id: str
    repo_full_name: str
    clone_url: str
    pr_number: int
    branch_name: str
    commit_sha: str
    block_merge_on_critical: bool
    provider: str = "github"
    provider_repo_id: Optional[str] = ""
    access_token: Optional[str] = ""
    trigger: Optional[str] = "manual"

@router.post("/launch")
@limiter.limit("10/minute")  # 🔐 SECURITY: Prevent webhook spam
async def launch_pr_review(request: Request, payload: PRReviewLaunchRequest):
    run_pr_review_task.delay(
        org_id=payload.organization_id,
        repo_id=payload.repository_id,
        pr_review_id=payload.pr_review_id,
        repo_full_name=payload.repo_full_name,
        clone_url=payload.clone_url,
        pr_number=payload.pr_number,
        branch_name=payload.branch_name,
        commit_sha=payload.commit_sha,
        block_merge_on_critical=payload.block_merge_on_critical,
        provider=payload.provider,
        provider_repo_id=payload.provider_repo_id or "",
        access_token=payload.access_token or "",
        trigger=payload.trigger,
    )
    return {"status": "enqueued", "pr_review_id": payload.pr_review_id}

@router.get("/{pr_review_id}/logs")
async def stream_pr_review_logs(pr_review_id: str, user=Depends(get_current_user)):
    # 🔐 SECURITY: Validate UUID format to prevent SQL injection
    validate_uuid(pr_review_id, "pr_review_id")

    # Fetch PR review with organization context
    pr = supabase_admin.table("pr_reviews") \
        .select("id, status, organization_id") \
        .eq("id", pr_review_id).single().execute()

    if not pr.data:
        raise HTTPException(404, "PR review not found")

    # 🔐 SECURITY: Verify user belongs to this organization
    user_id = user.get("sub")
    org_id = pr.data["organization_id"]

    if not verify_organization_access(user_id, org_id):
        raise HTTPException(403, "Access denied: You don't have permission to view this PR review")

    channel = f"pr_review:{pr_review_id}:logs"

    async def event_generator():
        async for message in subscribe_to_channel(channel):
            yield f"data: {json.dumps(message)}\n\n"
            status = message.get("data", {}).get("status", "")
            if message.get("type") == "status" and status in ("completed", "failed"):
                break

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
