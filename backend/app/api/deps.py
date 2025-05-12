from collections.abc import Iterator

from sqlalchemy.orm import Session

from app.db.base import SessionLocal


def get_database() -> Iterator[Session]:
    """
    Dependency to get a Session to the SQLite database.

    Yields:
        A Session connection to the database.
    """

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
