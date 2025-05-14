from fastapi import APIRouter, Body, Depends
from sqlalchemy.orm.session import Session

from app.api.deps import get_database
from app.db.query import require_account, require_income
from app.models.income import Income
from app.schemas.income import NewIncomeSchema, ReturnIncomeSchema


income_router = APIRouter(
    prefix='/income',
    tags=['Income'],
)


@income_router.post('/new')
def create_income(
    new_income: NewIncomeSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnIncomeSchema:

    # Verify the destination Account exists
    _ = require_account(db, new_income.account_id, raise_exception=True)

    income = Income(**new_income.model_dump())
    db.add(income)
    db.commit()

    return income


@income_router.get('/all')
def get_all_incomes(
    db: Session = Depends(get_database),
) -> list[ReturnIncomeSchema]:

    return db.query(Income).all()


@income_router.get('/{income_id}')
def get_income_by_id(
    income_id: int,
    db: Session = Depends(get_database),
) -> ReturnIncomeSchema:

    return require_income(db, income_id, raise_exception=True)


@income_router.delete('/{income_id}')
def delete_income(
    income_id: int,
    db: Session = Depends(get_database),
) -> None:

    income = require_income(db, income_id, raise_exception=True)
    db.delete(income)
    db.commit()


@income_router.patch('/{income_id}')
async def patch_income(
    income_id: int,
    income_update: UpdateIncomeSchema = Body(...),
    db: Session = Depends(get_database),
) -> ReturnIncomeSchema:

    # Verify the income exists
    income = require_income(db, income_id, raise_exception=True)

    # Verify the new Account exists if it's being updated
    if ('account_id' in income_update.model_fields_set
        and income_update.account_id is not None):
        _ = require_account(db, income_update.account_id, raise_exception=True)

    # Only update fields that were explicitly specified
    for field_name, value in income_update.model_dump().items():
        if field_name in income_update.model_fields_set:
            setattr(income, field_name, value)
    
    db.commit()
    
    return income
