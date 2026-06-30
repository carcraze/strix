from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.api.endpoints import scans, scan_logs, pr_reviews, code_scan, cto_scan, compliance

# 🔐 SECURITY: Initialize rate limiter to prevent abuse
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title=settings.PROJECT_NAME)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://app.zentinel.dev",
        "https://zentinel.dev",
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scans.router)
app.include_router(scan_logs.router)
app.include_router(pr_reviews.router)
app.include_router(code_scan.router)   # Day Zero code scanning pipeline
app.include_router(cto_scan.router)    # CTO super admin pentest panel
app.include_router(compliance.router)  # Compliance posture (Kenya & UK frameworks)

@app.get("/")
@limiter.limit("60/minute")  # Basic rate limit for health check
async def root(request: Request):
    return {"message": "Welcome to Zentinel.dev API"}

