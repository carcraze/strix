# Zentinel Backend — Final Deployment Plan
# Redis: 10.2.230.27:6379 (GCP Memorystore us-central1) ✅ Already running
# Auth: Workload Identity (no JSON key needed on GCP)
# Strix: runs Docker sandbox per scan, container nuked after test ✅

---

## STEP 0 — Code fixes (do this in Cursor FIRST, then deploy)

Tell Cursor:
> "Make these 4 fixes in the backend:
> 1. app/workers/tasks.py — change celery broker from hardcoded redis://localhost to settings.REDIS_URL
> 2. app/services/redis_service.py — change hardcoded redis://localhost to settings.REDIS_URL
> 3. app/api/endpoints/scans.py — import get_current_user from app.core.security, add as Depends() on the launch endpoint
> 4. app/core/config.py — add REDIS_URL: str = 'redis://localhost:6379' to Settings class"

---

## STEP 1 — Store secrets in Secret Manager (run once)

```bash
# Supabase
echo -n "https://YOUR_PROJECT.supabase.co" | \
  gcloud secrets create zentinel-supabase-url --data-file=- 2>/dev/null || \
  echo -n "https://YOUR_PROJECT.supabase.co" | \
  gcloud secrets versions add zentinel-supabase-url --data-file=-

echo -n "YOUR_SUPABASE_SERVICE_ROLE_KEY" | \
  gcloud secrets create zentinel-supabase-service-key --data-file=- 2>/dev/null || \
  echo -n "YOUR_SUPABASE_SERVICE_ROLE_KEY" | \
  gcloud secrets versions add zentinel-supabase-service-key --data-file=-

echo -n "YOUR_SUPABASE_JWT_SECRET" | \
  gcloud secrets create zentinel-jwt-secret --data-file=- 2>/dev/null || \
  echo -n "YOUR_SUPABASE_JWT_SECRET" | \
  gcloud secrets versions add zentinel-jwt-secret --data-file=-
```

---

## STEP 2 — Create Artifact Registry repo (run once)

```bash
gcloud artifacts repositories create zentinel-backend \
  --repository-format=docker \
  --location=us-central1 \
  --description="Zentinel backend images"
```

---

## STEP 3 — Deploy zentinel-api (FastAPI)

```bash
cd ~/Desktop/strix/backend

# Build and deploy in one command
gcloud run deploy zentinel-api \
  --source . \
  --dockerfile Dockerfile \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10 \
  --vpc-connector zentinel-vpc-connector \
  --set-env-vars ENVIRONMENT=production,REDIS_URL=redis://10.2.230.27:6379,VERTEX_PROJECT=modorra-f3abd,VERTEX_LOCATION=us-central1 \
  --set-secrets SUPABASE_URL=zentinel-supabase-url:latest,SUPABASE_KEY=zentinel-supabase-service-key:latest,JWT_SECRET=zentinel-jwt-secret:latest
```

⚠️ NOTE: Memorystore Redis is on a private VPC. You need a VPC connector.
If you don't have one yet:

```bash
gcloud compute networks vpc-access connectors create zentinel-vpc-connector \
  --region us-central1 \
  --range 10.8.0.0/28
```

Then re-run the deploy command above.

After deploy, note the URL shown — looks like:
  https://zentinel-api-xxxx-uc.a.run.app

---

## STEP 4 — Deploy zentinel-worker (Celery)

```bash
cd ~/Desktop/strix/backend

gcloud run deploy zentinel-worker \
  --source . \
  --dockerfile Dockerfile.worker \
  --region us-central1 \
  --platform managed \
  --no-allow-unauthenticated \
  --port 8080 \
  --memory 4Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 5 \
  --vpc-connector zentinel-vpc-connector \
  --set-env-vars ENVIRONMENT=production,REDIS_URL=redis://10.2.230.27:6379,VERTEX_PROJECT=modorra-f3abd,VERTEX_LOCATION=us-central1,STRIX_LLM=vertex_ai/gemini-2.5-pro,STRIX_TELEMETRY=false \
  --set-secrets SUPABASE_URL=zentinel-supabase-url:latest,SUPABASE_KEY=zentinel-supabase-service-key:latest
```

⚠️ NOTE on Strix Docker sandboxes on Cloud Run:
Cloud Run does NOT support Docker-in-Docker (no /var/run/docker.sock).
Strix creates sandboxes via Docker — this means the worker needs the
sandbox to run IN-PROCESS (no nested Docker).

Check if Strix supports a non-Docker runtime mode:
  from strix.runtime import get_runtime
  print(type(get_runtime()))

If it requires Docker → you need a GCE instance for the worker (see STEP 4B).
If it has an in-process mode → Cloud Run worker works fine.

---

## STEP 4B — GCE Worker (if Strix needs Docker socket)

```bash
# Create the instance
gcloud compute instances create zentinel-worker-1 \
  --zone us-central1-a \
  --machine-type e2-standard-4 \
  --image-family ubuntu-2204-lts \
  --image-project ubuntu-os-cloud \
  --boot-disk-size 50GB \
  --scopes cloud-platform

# SSH in
gcloud compute ssh zentinel-worker-1 --zone us-central1-a

# On the instance:
curl -fsSL https://get.docker.com | bash
pip3 install celery redis fastapi strix-ai supabase pyjwt

# Set env vars
export REDIS_URL=redis://10.2.230.27:6379
export SUPABASE_URL=https://YOUR_PROJECT.supabase.co
export SUPABASE_KEY=YOUR_SERVICE_ROLE_KEY
export STRIX_LLM=vertex_ai/gemini-2.5-pro
export STRIX_TELEMETRY=false

# Clone your backend repo and run worker
git clone https://github.com/YOUR_ORG/zentinel-backend .
celery -A app.workers.tasks.celery_app worker --loglevel=info --concurrency=2 -Q scans
```

---

## STEP 5 — Wire frontend to backend API

In your Next.js frontend repo, add to .env.local AND Cloud Run env vars:

```
NEXT_PUBLIC_SCANNER_BACKEND_URL=https://zentinel-api-xxxx-uc.a.run.app
```

The wizard already POSTs to this URL. Redeploy frontend after adding.

---

## STEP 6 — Grant Workload Identity for Vertex AI

```bash
# Get the Cloud Run service account
gcloud run services describe zentinel-worker \
  --region us-central1 \
  --format='value(spec.template.spec.serviceAccountName)'

# Grant Vertex AI access to that service account
gcloud projects add-iam-policy-binding modorra-f3abd \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/aiplatform.user"
```

---

## STEP 7 — Verify

```bash
# 1. API health check
curl https://zentinel-api-xxxx-uc.a.run.app/health
# Expected: {"status": "ok"}

# 2. Worker connected to Redis
gcloud run services logs read zentinel-worker --region us-central1 --limit 20
# Expected: "celery@... ready" + "Connected to redis://10.2.230.27:6379"

# 3. End-to-end scan test
# Go to app.zentinel.dev → Pentests → New → Quick Scan → submit
# Watch: gcloud run services logs read zentinel-worker --region us-central1 --tail
# Supabase: check pentests table — status should go pending → running → completed
```

---

## How Strix sandboxes work (the Docker question)

Each scan Strix runs creates an isolated Docker container:
- Fresh container per scan target
- No network access to other containers
- Nuked (docker rm -f) immediately after scan completes
- Findings extracted before nuke → saved to Supabase

This is why the worker needs Docker access.
On GCE: mount /var/run/docker.sock ✅
On Cloud Run: not supported ❌ → use GCE for worker

---

## Environment variables — full reference

| Variable             | Service        | Value                              |
|----------------------|----------------|------------------------------------|
| REDIS_URL            | api + worker   | redis://10.2.230.27:6379           |
| SUPABASE_URL         | api + worker   | https://xxx.supabase.co            |
| SUPABASE_KEY         | api + worker   | service role key                   |
| JWT_SECRET           | api only       | supabase jwt secret                |
| VERTEX_PROJECT       | worker         | modorra-f3abd                      |
| VERTEX_LOCATION      | worker         | us-central1                        |
| STRIX_LLM            | worker         | vertex_ai/gemini-2.5-pro           |
| STRIX_TELEMETRY      | worker         | false                              |
| ENVIRONMENT          | both           | production                         |
