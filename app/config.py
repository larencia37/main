from pydantic import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = 'postgresql+psycopg2://postgres:postgres@db:5432/venehealth'
    SECRET_KEY: str = 'changeme1234567890'
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    MINIO_ENDPOINT: str = 'http://minio:9000'
    MINIO_ACCESS_KEY: str = 'minioadmin'
    MINIO_SECRET_KEY: str = 'minioadmin'
    MINIO_BUCKET: str = 'documents'
    MINIO_SECURE: bool = False
    TENANT_HEADER: str = 'x-tenant-id'

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'

settings = Settings()
