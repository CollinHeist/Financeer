from typing import TypeVar, overload

from fastapi.exceptions import HTTPException
from sqlalchemy.orm.session import Session

from app.db.base import Base
from app.models.account import Account
from app.models.expense import Expense
from app.models.income import Income
from app.models.transaction import Transaction


_ModelType = TypeVar('_ModelType', bound=Base) # type: ignore


@overload
def _require_model(
    db: Session,
    model: _ModelType,
    id: int,
    *,
    raise_exception: bool = True,
) -> _ModelType:
    ...

def _require_model(
    db: Session,
    model: _ModelType,
    id: int,
    *,
    raise_exception: bool = True,
) -> _ModelType | None:
    """
    Generic function to query and return a model by ID.

    Args:
        db: The database session.
        model: The model to query.
        id: The ID of the model to query.
        raise_exception: Whether to raise an HTTPException if the model
            is not found.

    Returns:
        The model object.

    Raises:
        HTTPException (404): The model is not found and
            `raise_exception` is True.
    """

    if not (item := db.query(model).filter(model.id == id).first()):
        if raise_exception:
            raise HTTPException(
                status_code=404,
                detail=f'{model.__name__} not found'
            )
        return None

    return item


@overload
def require_account(
    db: Session,
    account_id: int,
    *,
    raise_exception: bool = True,
) -> Account:
    ...

def require_account(
    db: Session,
    account_id: int,
    *,
    raise_exception: bool = True,
) -> Account | None:
    """
    Query and return an Account by ID

    Args:
        db: The database session.
        account_id: The ID of the Account to query.
    """

    return _require_model(
        db, Account, account_id, raise_exception=raise_exception
    )


@overload
def require_expense(
    db: Session,
    expense_id: int,
    *,
    raise_exception: bool = True,
) -> Expense:
    ...

def require_expense(
    db: Session,
    expense_id: int,
    *,
    raise_exception: bool = True,
) -> Expense | None:
    """
    Query and return an Expense by ID

    Args:
        db: The database session.
        expense_id: The ID of the Expense to query.
    """

    return _require_model(
        db, Expense, expense_id, raise_exception=raise_exception
    )


@overload
def require_income(
    db: Session,
    income_id: int,
    *,
    raise_exception: bool = True,
) -> Income:
    ...

def require_income(
    db: Session,
    income_id: int,
    *,
    raise_exception: bool = True,
) -> Income | None:
    """
    Query and return an Income by ID

    Args:
        db: The database session.
        income_id: The ID of the Income to query.
    """

    return _require_model(db, Income, income_id,raise_exception=raise_exception)


@overload
def require_transaction(
    db: Session,
    transaction_id: int,
    *,
    raise_exception: bool = True,
) -> Transaction:
    ...

def require_transaction(
    db: Session,
    transaction_id: int,
    *,
    raise_exception: bool = True,
) -> Transaction | None:
    """
    Query and return a Transaction by ID

    Args:
        db: The database session.
        transaction_id: The ID of the Transaction to query.
    """

    return _require_model(
        db, Transaction, transaction_id, raise_exception=raise_exception
    )
