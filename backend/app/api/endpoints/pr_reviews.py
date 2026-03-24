from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import json

from app.workers.pr_task import run_pr_review_task
from app.services.redis_service import subscribe_to_channel
from app.services.supabase import supabase_admin
from app.core.security import get_current_user

router = APIRouter(prefix="/api/pr-reviews", tags=["pr-reviews"])

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
async def launch_pr_review(payload: PRReviewLaunchRequest):
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
async def stream_pr_review_logs(pr_review_id: str):
    # Skip strict auth for PR logs by default because it's typically a webhook triggering it
    # But you could enforce get_current_user if the dashboard is viewing it.
    # We will just verify the PR exists.
    pr = supabase_admin.table("pr_reviews") \
        .select("id, status") \
        .eq("id", pr_review_id).single().execute()

    if not pr.data:
        return {"error": "Not found"}

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
