import os
from typing import Optional

try:
    from pydantic_settings import BaseSettings
    class Settings(BaseSettings):
        PROJECT_NAME: str = "Abundance Clinic OS"
        VERSION: str = "1.0.0"
        API_V1_STR: str = "/api/v1"
        DATABASE_URL: Optional[str] = None
        SUPABASE_URL: Optional[str] = None
        SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
        GHL_API_BASE_URL: str = "https://services.leadconnectorhq.com"
        GHL_CLIENT_ID: Optional[str] = None
        GHL_CLIENT_SECRET: Optional[str] = None
        GHL_API_VERSION: str = "2021-07-28"
        OPENAI_API_KEY: Optional[str] = None
        OPENAI_MODEL: str = "gpt-4o"
        PHI_ENCRYPTION_KEY: Optional[str] = None
        class Config:
            env_file = ".env"
            case_sensitive = True
except ImportError:
    class Settings:
        PROJECT_NAME: str = "Abundance Clinic OS"
        VERSION: str = "1.0.0"
        API_V1_STR: str = "/api/v1"
        DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")
        SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL")
        SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        GHL_API_BASE_URL: str = os.getenv("GHL_API_BASE_URL", "https://services.leadconnectorhq.com")
        GHL_CLIENT_ID: Optional[str] = os.getenv("GHL_CLIENT_ID")
        GHL_CLIENT_SECRET: Optional[str] = os.getenv("GHL_CLIENT_SECRET")
        GHL_API_VERSION: str = os.getenv("GHL_API_VERSION", "2021-07-28")
        OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
        OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")
        PHI_ENCRYPTION_KEY: Optional[str] = os.getenv("PHI_ENCRYPTION_KEY")


settings = Settings()
