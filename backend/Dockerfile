FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install strix package (needed by Celery workers)
COPY pyproject.toml /strix-pkg/pyproject.toml
COPY strix /strix-pkg/strix
COPY README.md /strix-pkg/README.md
RUN pip install --no-cache-dir /strix-pkg && rm -rf /strix-pkg

# Copy backend code
COPY backend/app ./app

ENV PYTHONUNBUFFERED=1
ENV PORT=8080

EXPOSE 8080

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2"]
