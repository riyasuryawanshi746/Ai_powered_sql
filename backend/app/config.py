"""
Application configuration using pydantic-settings.
Reads from .env file automatically.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    gemini_api_key: str = ""
    allowed_origins: str = "http://localhost:3000"
    database_url: str = "sqlite:///./data.db"
    upload_dir: str = "uploads"
    max_file_size_mb: int = 50

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
