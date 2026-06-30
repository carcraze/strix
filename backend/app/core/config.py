from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Zentinel.dev API"

    # ── LLM Model Fallback Chain ──────────────────────────────────
    # Priority order for pentesting scans:
    # 1. Claude Opus 4.6 via AWS Bedrock (best reasoning)
    # 2. Qwen 3.5 397B via NVIDIA NIM (massive model, great for security)
    # 3. DeepSeek V4 Pro via NVIDIA NIM (strong reasoning)
    # 4. Vertex AI Gemini 2.5 Pro (fast, GCP-native)
    # 5. DeepSeek V4 Flash via NVIDIA NIM (cheapest, thinking mode)
    STRIX_LLM: str = "bedrock/anthropic.claude-opus-4-6-20250514-v1:0"
    STRIX_LLM_FALLBACK_1: str = "nvidia_nim/qwen/qwen3.5-397b-a17b"
    STRIX_LLM_FALLBACK_2: str = "nvidia_nim/deepseek-ai/deepseek-v4-pro"
    STRIX_LLM_FALLBACK_3: str = "vertex_ai/gemini-2.5-pro"
    STRIX_LLM_FALLBACK_4: str = "nvidia_nim/deepseek-ai/deepseek-v4-flash"

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
