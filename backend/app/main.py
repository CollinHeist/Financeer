from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi_pagination import add_pagination
from starlette.middleware.cors import CORSMiddleware

from app.api import api_router
from app.db.migrate import perform_db_migrations


@asynccontextmanager
async def lifespan(app: FastAPI):

    perform_db_migrations()

    yield

    pass


app = FastAPI(lifespan=lifespan)

app.include_router(api_router)
add_pagination(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
