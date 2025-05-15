from fastapi import APIRouter, Body, Depends
from sqlalchemy.orm.session import Session

from app.api.deps import get_database
from app.db.query import require_account
from app.models.balance import Balance
from app.schemas.balance import NewBalanceSchema, ReturnBalanceSchema


balance_router = APIRouter(
    prefix='/balance',
    tags=['Balance'],
)


@balance_router.post('/new')
def create_balance(
    new_balance: NewBalanceSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnBalanceSchema:

    # Verify that the associated Account exists
    require_account(db, new_balance.account_id, raise_exception=True)

    balance = Balance(**new_balance.model_dump())
    db.add(balance)
    db.commit()

    return balance
