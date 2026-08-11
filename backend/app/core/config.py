import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Excel Processing Workflow Dashboard"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "SUPER_SECRET_KEY_FOR_ENTERPRISE_EXCEL_DASHBOARD_2026_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours

    # Easypanel Self-Hosted PostgreSQL Database URL
    DATABASE_URL: str = "postgresql://lph_admin:p09uhqnei5x9c9apugp7@76.13.185.191:5432/lph_data"

    # S3 Object Storage Credentials
    AWS_ENDPOINT_URL_S3: Optional[str] = "https://br-wispy-star-ax0rjteq.storage.c-4.us-east-2.aws.neon.tech"
    AWS_ACCESS_KEY_ID: Optional[str] = "nak_live_46246e568e004fe69e87a4103cf1a53f"
    AWS_SECRET_ACCESS_KEY: Optional[str] = "nsk_live_a20f519652f8624b6359fdf6b0b3e03e3aa0ebc597141f6b6c9ef8c290239ef8"
    AWS_REGION: Optional[str] = "us-east-2"

    # AI Gateway / OpenAI Key
    OPENAI_API_KEY: Optional[str] = "nt_live_46246e568e00_c0x3L9IjaaOjpuqf7gyUm9QwLp7lIE9O"

    class Config:
        env_file = ".env"

settings = Settings()
