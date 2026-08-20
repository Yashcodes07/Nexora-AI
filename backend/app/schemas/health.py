from pydantic import BaseModel
from typing import Literal


class HealthStatus(BaseModel):
    overall: Literal["healthy", "unhealthy"]
    postgres: Literal["ok", "error"]