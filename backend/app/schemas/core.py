from typing import Literal, TypedDict

from pydantic import BaseModel, Field


class TransactionFilter(BaseModel):
    on: Literal['amount', 'description', 'note']
    type: Literal['contains', 'regex', 'eq', 'gt', 'gte', 'lt', 'lte']
    value: str = Field(min_length=1)

class TransactionFilterDict(TypedDict):
    on: Literal['description', 'note']
    type: Literal['contains', 'regex', 'eq', 'gt', 'gte', 'lt', 'lte']
    value: str
