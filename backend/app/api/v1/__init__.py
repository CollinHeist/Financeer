from fastapi.routing import APIRouter

from .account import account_router
from .auth import router as auth_router
from .balance import balance_router
from .bills import bill_router
from .cashflow import cashflow_router
from .expenses import expense_router
from .income import income_router
from .plaid import router as plaid_router
from .transactions import transaction_router
from .transfers import transfers_router
from .uploads import upload_router

v1_router = APIRouter(prefix='/v1')

v1_router.include_router(auth_router)
v1_router.include_router(account_router)
v1_router.include_router(balance_router)
v1_router.include_router(bill_router)
v1_router.include_router(cashflow_router)
v1_router.include_router(expense_router)
v1_router.include_router(income_router)
v1_router.include_router(plaid_router)
v1_router.include_router(transaction_router)
v1_router.include_router(transfers_router)
v1_router.include_router(upload_router)


__all__ = [
    'v1_router',
]
