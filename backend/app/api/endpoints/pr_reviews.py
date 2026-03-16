from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.workers.pr_task import run_pr_review_task

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
    )
    
    return {"status": "enqueued", "pr_review_id": payload.pr_review_id}
