from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Kangku API"
    environment: str = "local"
    database_url: str = "postgresql+psycopg://kangku:kangku@localhost:5432/kangku"
    s3_endpoint_url: str | None = "http://localhost:9000"
    s3_bucket: str = "kangku-dev"

    model_config = SettingsConfigDict(env_prefix="KANGKU_", env_file=".env", extra="ignore")


settings = Settings()
