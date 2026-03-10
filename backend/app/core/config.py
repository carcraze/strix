from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Zentinel.dev API"

    # Vertex AI
    VERTEX_PROJECT: str = "moyopal-453021"
    VERTEX_LOCATION: str = "us-central1"
    STRIX_LLM: str = "vertex_ai/gemini-2.5-pro"

    # Redis — set as full URL, defaults to Memorystore
    REDIS_URL: str = "redis://10.2.230.27:6379"

    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str  # Service Role Key for backend ops

    # JWT Secret (for verifying Supabase tokens)
    JWT_SECRET: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
