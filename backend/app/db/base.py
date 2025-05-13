from datetime import date, datetime
from json import loads, dumps
from typing import Any

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.types import TypeDecorator, JSON


SQLALCHEMY_DATABASE_URL = 'sqlite:///../config/budget.sqlite'

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={'check_same_thread': False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def json_serializer(obj: Any):
    """Serialize datetime objects to ISO strings"""

    if isinstance(obj, (date, datetime)):
        return obj.isoformat()

    raise TypeError(f'Type {type(obj)} not JSON serializable')


def json_deserializer(obj: Any):
    """Deserialize ISO strings back to date objects"""

    if isinstance(obj, dict):
        for key, value in obj.items():
            if isinstance(value, str):
                try:
                    obj[key] = date.fromisoformat(value)
                except ValueError:
                    pass
    return obj


class JSONWithDates(TypeDecorator):
    impl = JSON # keep underlying JSON type for dialect compatibility
    cache_ok = True

    def process_bind_param(self, value: Any | None, dialect):
        if value is not None:
            return loads(dumps(value, default=json_serializer))
        return None


    def process_result_value(self, value: Any | None, dialect):
        if value is not None:
            # Deserialize list of dicts
            if isinstance(value, list):
                return [
                    json_deserializer(item)
                    if isinstance(item, dict)
                    else item
                    for item in value
                ]
            return value
        return None
