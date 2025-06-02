from datetime import datetime

from pydantic import BaseModel


class NewLinkAccountSchema(BaseModel):
    plaid_account_id: str
    plaid_item_id: int
    account_id: int

class AccountBalance(BaseModel):
    available: float
    current: float
    limit: float | None = None

class ReturnPlaidAccountInfoSchema(BaseModel):
    id: str
    plaid_item_id: int
    name: str
    balances: AccountBalance

class ReturnAccessTokenResponse(BaseModel):
    access_token: str

class ReturnLinkTokenResponse(BaseModel):
    link_token: str

class ReturnPlaidItemSchema(BaseModel):
    id: int
    last_refresh: datetime
