from pydantic import BaseModel, Field


class NewBudgetSchema(BaseModel):
    name: str
    description: str
    amount: float = Field(gt=0)
    is_active: bool = True
    allow_rollover: bool = False
    max_rollover_amount: float | None = None

class UpdateBudgetSchema(BaseModel):
    name: str | None = None
    description: str | None = None
    amount: float | None = None
    is_active: bool | None = None
    allow_rollover: bool | None = None
    max_rollover_amount: float | None = None

class ReturnBudgetSchema(BaseModel):
    id: int
    name: str
    description: str
    amount: float
    is_active: bool
    allow_rollover: bool
    max_rollover_amount: float | None
