# Deployment Guide: Zentinel Frontend

## Recommended: Google Cloud Run (Docker)
We recommend deploying the frontend to **Google Cloud Run** using Docker. This approach ensures:
- **Consistency** with the backend (which will also be containerized).
- **Scalability** (scale to zero when not in use).
- **Security** (run in a private VPC if needed).
- **Performance** (Cloud Run supports HTTP/2 and global load balancing).

### Prerequisites
- [Google Cloud CLI (`gcloud`)](https://cloud.google.com/sdk/docs/install) installed and authenticated.
- Docker installed and running.

### Steps

1.  **Build the Container Image**
    Run this from the `frontend/` directory:
    ```bash
    gcloud builds submit --tag gcr.io/moyopal-453021/zentinel-frontend
    ```

2.  **Deploy to Cloud Run**
    ```bash
    gcloud run deploy zentinel-frontend \
      --image gcr.io/moyopal-453021/zentinel-frontend \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --port 3000 \
      --memory 1Gi \
      --cpu 1 \
      --concurrency 80 \
      --max-instances 10
    ```

3.  **Verify**
    The command will output a Service URL (e.g., `https://zentinel-frontend-xyz-uc.a.run.app`). Visit this URL to test the application.

---

## Alternative: Firebase Hosting
If you prefer Firebase, you can use **Firebase Hosting** with "Web Frameworks" support.

1.  **Initialize Firebase**
    ```bash
    npm install -g firebase-tools
    firebase login
    firebase init hosting
    ```
    - Select **"Web Frameworks (experimental)"** if prompted, or just standard Hosting.
    - Set `source` directory to `.` (current directory).

2.  **Deploy**
    ```bash
    firebase deploy
    ```
    *Note: Next.js SSR on Firebase functions can suffer from "cold starts". Cloud Run (Docker) is generally more performant for dynamic apps.*
