import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PLANET_API_KEY: str = "PLAK4539d7d566d0422ca3606fa90e9d6ff5"
    PLANET_BASE_URL: str = "https://api.planet.com/data/v1"
    PLANET_TILES_URL: str = "https://tiles.planet.com/data/v1"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
