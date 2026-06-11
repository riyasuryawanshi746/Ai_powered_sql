"""
Application configuration using pydantic-settings.
Reads from .env file automatically.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    groq_api_key: str = ""  # Must be string quotes, NOT unquoted variable names!
    allowed_origins: str = "http://localhost:3000"
    database_url: str = "sqlite:///./data.db"
    upload_dir: str = "uploads"
    max_file_size_mb: int = 50

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()