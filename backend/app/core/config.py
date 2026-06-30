from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Zentinel.dev API"

    # ── LLM Model Fallback Chain ──────────────────────────────────
    # Priority order for pentesting scans:
    # 1. Claude Opus 4.6 via AWS Bedrock (best reasoning, cross-region inference)
    # 2. Claude Sonnet 4.6 via AWS Bedrock (fast, cross-region inference)
    # 3. Vertex AI Gemini 2.5 Pro (fast, GCP-native — proven working)
    # 4. NVIDIA NIM Qwen 3.5 397B (massive model, great for security)
    # 5. NVIDIA NIM DeepSeek V4 Flash (cheapest, thinking mode)
    #
    # Bedrock model IDs (cross-region inference):
    #   Opus:   us.anthropic.claude-opus-4-6-v1
    #   Sonnet: us.anthropic.claude-sonnet-4-6-v1
    STRIX_LLM: str = "bedrock/us.anthropic.claude-opus-4-6-v1"
    STRIX_LLM_FALLBACK_1: str = "bedrock/us.anthropic.claude-sonnet-4-6-v1"
    STRIX_LLM_FALLBACK_2: str = "vertex_ai/gemini-2.5-pro"
    STRIX_LLM_FALLBACK_3: str = "nvidia_nim/qwen/qwen3.5-397b-a17b"
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
