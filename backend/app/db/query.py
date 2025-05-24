from typing import TypeVar, overload

from app.models.balance import Balance
from fastapi.exceptions import HTTPException
from sqlalchemy.orm.session import Session

from app.db.base import Base
from app.models.account import Account
from app.models.bill import Bill
from app.models.expense import Expense
from app.models.income import Income
from app.models.transfer import Transfer
from app.models.transaction import Transaction


_ModelType = TypeVar('_ModelType', bound=Base) # type: ignore


@overload
def _require_model(
    db: Session,
    model: _ModelType,
    id: int,
    *,
    raise_exception: bool = True,
) -> _ModelType: ...

@overload
def _require_model(
    db: Session,
    model: _ModelType,
    id: int,
    *,
    raise_exception: bool = False,
) -> _ModelType | None: ...

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

    if not (item := db.query(model).get(id)):
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
) -> Account: ...

@overload
def require_account(
    db: Session,
    account_id: int,
    *,
    raise_exception: bool = False,
) -> Account | None: ...

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
def require_balance(
    db: Session,
    balance_id: int,
    *,
    raise_exception: bool = True,
) -> Balance: ...

@overload
def require_balance(
    db: Session,
    balance_id: int,
    *,
    raise_exception: bool = False,
) -> Balance | None: ...

def require_balance(
    db: Session,
    balance_id: int,
    *,
    raise_exception: bool = True,
) -> Balance | None:
    """
    Query and return an Balance by ID

    Args:
        db: The database session.
        balance_id: The ID of the Balance to query.
    """

    return _require_model(
        db, Balance, balance_id, raise_exception=raise_exception
    )


@overload
def require_bill(
    db: Session,
    bill_id: int,
    *,
    raise_exception: bool = True,
) -> Bill: ...

@overload
def require_bill(
    db: Session,
    bill_id: int,
    *,
    raise_exception: bool = False,
) -> Bill | None: ...

def require_bill(
    db: Session,
    bill_id: int,
    *,
    raise_exception: bool = True,
) -> Bill | None:
    """
    Query and return an Bill by ID

    Args:
        db: The database session.
        bill_id: The ID of the Bill to query.
    """

    return _require_model(
        db, Bill, bill_id, raise_exception=raise_exception
    )


@overload
def require_income(
    db: Session,
    income_id: int,
    *,
    raise_exception: bool = True,
) -> Income: ...

@overload
def require_income(
    db: Session,
    income_id: int,
    *,
    raise_exception: bool = False,
) -> Income | None: ...

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
def require_expense(
    db: Session,
    expense_id: int,
    *,
    raise_exception: bool = True,
) -> Expense: ...

@overload
def require_expense(
    db: Session,
    expense_id: int,
    *,
    raise_exception: bool = False,
) -> Expense | None: ...

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
def require_transfer(
    db: Session,
    transfer_id: int,
    *,
    raise_exception: bool = True,
) -> Transaction: ...

@overload
def require_transfer(
    db: Session,
    transfer_id: int,
    *,
    raise_exception: bool = False,
) -> Transaction | None: ...

def require_transfer(
    db: Session,
    transfer_id: int,
    *,
    raise_exception: bool = True,
) -> Transaction | None:
    """
    Query and return a Transfer by ID.

    Args:
        db: The database session.
        transfer_id: The ID of the Transfer to query.
    """

    return _require_model(
        db, Transfer, transfer_id, raise_exception=raise_exception
    )


@overload
def require_transaction(
    db: Session,
    transaction_id: int,
    *,
    raise_exception: bool = True,
) -> Transaction: ...

@overload
def require_transaction(
    db: Session,
    transaction_id: int,
    *,
    raise_exception: bool = False,
) -> Transaction | None: ...

def require_transaction(
    db: Session,
    transaction_id: int,
    *,
    raise_exception: bool = True,
) -> Transaction | None:
    """
    Query and return a Transaction by ID.

    Args:
        db: The database session.
        transaction_id: The ID of the Transaction to query.
    """

    return _require_model(
        db, Transaction, transaction_id, raise_exception=raise_exception
    )
