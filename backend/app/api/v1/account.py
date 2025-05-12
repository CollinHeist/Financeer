from app.models.account import Account
from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm.session import Session

from app.api.deps import get_database
from app.schemas.account import NewAccountSchema, ReturnAccountSchema


account_router = APIRouter(
    prefix='/account',
    tags=['Account'],
)


@account_router.post('/new')
def create_account(
    new_account: NewAccountSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnAccountSchema:

    account = Account(
        name=new_account.name,
        type=new_account.type,
        account_number=new_account.account_number,
        routing_number=new_account.routing_number,
        interest=new_account.interest,
    )
    db.add(account)
    db.commit()

    return account


@account_router.get('/all')
def get_all_accounts(
    db: Session = Depends(get_database),
) -> list[ReturnAccountSchema]:

    return db.query(Account).all()


@account_router.get('/{account_id}')
def get_account_by_id(
    account_id: int,
    db: Session = Depends(get_database),
) -> ReturnAccountSchema:

    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    return account


@account_router.delete('/{account_id}')
def delete_account(
    account_id: int,
    db: Session = Depends(get_database),
) -> None:

    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(account)
    db.commit()

    return account
