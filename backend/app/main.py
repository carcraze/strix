from fastapi import FastAPI, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.api.endpoints import scans, scan_logs, pr_reviews

# 🔐 SECURITY: Initialize rate limiter to prevent abuse
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title=settings.PROJECT_NAME)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(scans.router)
app.include_router(scan_logs.router)
app.include_router(pr_reviews.router)

@app.get("/")
@limiter.limit("60/minute")  # Basic rate limit for health check
async def root(request: Request):
    return {"message": "Welcome to Zentinel.dev API"}

