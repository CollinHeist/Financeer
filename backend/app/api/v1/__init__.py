from fastapi.routing import APIRouter

from .account import account_router
from .expense import expense_router
from .income import income_router
from .transaction import transaction_router
from .upload import upload_router

v1_router = APIRouter(prefix='/v1')

v1_router.include_router(account_router)
v1_router.include_router(expense_router)
v1_router.include_router(income_router)
v1_router.include_router(transaction_router)
v1_router.include_router(upload_router)


__all__ = [
    'v1_router',
]
