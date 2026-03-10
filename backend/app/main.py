from fastapi import FastAPI
from app.core.config import settings
from app.api.endpoints import scans, scan_logs, pr_reviews

app = FastAPI(title=settings.PROJECT_NAME)

app.include_router(scans.router)
app.include_router(scan_logs.router)
app.include_router(pr_reviews.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Zentinel.dev API"}

