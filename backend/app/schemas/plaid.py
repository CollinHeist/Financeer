from datetime import datetime

from pydantic import BaseModel


class ReturnPlaidItemSchema(BaseModel):
    id: int
    last_refresh: datetime
