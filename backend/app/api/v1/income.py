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

    income = Income(
        name=new_income.name,
        type=new_income.type,
        amount=new_income.amount,
        frequency=new_income.frequency,
        start_date=new_income.start_date,
        end_date=new_income.end_date,
        account_id=new_income.account_id,
        change_schedule=new_income.change_schedule,
    )
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
