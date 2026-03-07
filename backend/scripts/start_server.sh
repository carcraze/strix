#!/bin/bash
# Start Redis (if local) - assuming external for prod but useful for dev
# redis-server --daemonize yes

# Start Celery Worker
celery -A app.workers.tasks worker --loglevel=info &

# Start FastAPI
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
