from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Zentinel.dev API"
    
    # Vertex AI
    VERTEX_PROJECT: str
    VERTEX_LOCATION: str = "us-central1"
    STRIX_LLM: str = "vertex_ai/gemini-2.5-pro"
    
    # Redis
    REDIS_HOST: str = "10.2.230.27"
    REDIS_PORT: int = 6379
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str  # Service Role Key for backend ops

    class Config:
        env_file = ".env"

settings = Settings()
