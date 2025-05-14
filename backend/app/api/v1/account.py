from app.db.query import require_account
from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm.session import Session

from app.api.deps import get_database
from app.models.account import Account
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

    account = Account(**new_account.model_dump())
    db.add(account)
    db.commit()

    return account


@account_router.get('/all')
def get_all_accounts(
    db: Session = Depends(get_database),
) -> list[ReturnAccountSchema]:

    return [
        ReturnAccountSchema(**account.__dict__)
        for account in db.query(Account).all()
    ]


@account_router.get('/banks')
def get_bank_accounts(
    db: Session = Depends(get_database),
) -> list[ReturnAccountSchema]:

    return [
        ReturnAccountSchema(**account.__dict__)
        for account in db.query(Account)
            .filter(
                or_(
                    Account.type == 'checking',
                    Account.type == 'investment',
                    Account.type == 'savings',
                )
            )
            .all()
    ]


@account_router.get('/{account_id}')
def get_account_by_id(
    account_id: int,
    db: Session = Depends(get_database),
) -> ReturnAccountSchema:

    return require_account(db, account_id, raise_exception=True)


@account_router.delete('/{account_id}')
def delete_account(
    account_id: int,
    db: Session = Depends(get_database),
) -> None:

    account = require_account(db, account_id, raise_exception=True)
    db.delete(account)
    db.commit()

    return None
