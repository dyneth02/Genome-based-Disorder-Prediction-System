import os
from typing import List

class Settings:
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        return os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

settings = Settings()