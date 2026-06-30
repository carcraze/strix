from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Zentinel.dev API"

    # ── LLM Model Fallback Chain ──────────────────────────────────
    # Priority order for pentesting scans:
    # 1. Anthropic via AWS Bedrock (best reasoning for security)
    # 2. Vertex AI Gemini (fast, good for DAST)
    # 3. NVIDIA NIM (cost-effective for large scans)
    # 4. Gemini via API key (fallback if Vertex quota exceeded)
    # 5. DeepSeek (last resort, cheapest)
    STRIX_LLM: str = "bedrock/anthropic.claude-sonnet-4-6-20250514-v1:0"
    STRIX_LLM_FALLBACK_1: str = "vertex_ai/gemini-2.5-pro"
    STRIX_LLM_FALLBACK_2: str = "nvidia_nim/meta/llama-3.3-70b-instruct"
    STRIX_LLM_FALLBACK_3: str = "gemini/gemini-2.5-pro"
    STRIX_LLM_FALLBACK_4: str = "deepseek/deepseek-chat"

    # ── GCP / Vertex AI ───────────────────────────────────────────
    VERTEX_PROJECT: str = "moyopal-453021"
    VERTEX_LOCATION: str = "us-central1"

    # ── AWS Bedrock ───────────────────────────────────────────────
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"

    # ── NVIDIA NIM ────────────────────────────────────────────────
    NVIDIA_NIM_API_KEY: str = ""

    # ── Gemini API key (direct, not Vertex) ───────────────────────
    GEMINI_API_KEY: str = ""

    # ── DeepSeek ──────────────────────────────────────────────────
    DEEPSEEK_API_KEY: str = ""

    # ── Redis ─────────────────────────────────────────────────────
    REDIS_URL: str = "redis://10.2.230.27:6379"

    # ── Supabase ──────────────────────────────────────────────────
    SUPABASE_URL: str
    SUPABASE_KEY: str  # Service Role Key for backend ops

    # ── JWT ───────────────────────────────────────────────────────
    JWT_SECRET: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
