import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PLANET_API_KEY: str = "PLAKe95cd5d349be4379a4524382dadf4568"
    PLANET_BASE_URL: str = "https://api.planet.com/data/v1"
    PLANET_TILES_URL: str = "https://tiles.planet.com/data/v1"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
