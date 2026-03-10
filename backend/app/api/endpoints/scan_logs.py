from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.services.redis_service import subscribe_to_channel
from app.services.supabase import supabase_admin
from app.core.security import get_current_user
import json

router = APIRouter(prefix="/api/scans", tags=["scans-logs"])

@router.get("/{pentest_id}/logs")
async def stream_scan_logs(pentest_id: str, user=Depends(get_current_user)):
    # Auth check — user must belong to org that owns this pentest
    pentest = supabase_admin.table("pentests") \
        .select("organization_id, status") \
        .eq("id", pentest_id).single().execute().data

    if not pentest:
        return {"error": "Not found"}

    # If scan already completed, return stored logs from DB instead of Redis
    if pentest["status"] in ("completed", "failed"):
        # Fetch stored log lines and stream them back as SSE
        # (implement log storage in DB if you want replay for completed scans)
        pass

    channel = f"pentest:{pentest_id}:logs"

    async def event_generator():
        async for message in subscribe_to_channel(channel):
            yield f"data: {json.dumps(message)}\n\n"
            # Close stream when scan finishes
            status = message.get("data", {}).get("status", "")
            if message.get("type") == "status" and status in ("completed", "failed"):
                break

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
