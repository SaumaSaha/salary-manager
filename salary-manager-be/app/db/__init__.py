"""Database infrastructure package.

Re-exports core database symbols for convenient imports::

    from app.db import get_db, init_db, Base, engine
    from app.db.models import Employee, CurrencyRate
    from app.db.adapter import IDatabaseAdapter, SQLAlchemyDatabaseAdapter, AggFunc, AggSpec
"""

from app.db.session import Base, SessionLocal, engine, get_db, init_db
from app.db.adapter import AggFunc, AggSpec, IDatabaseAdapter, SQLAlchemyDatabaseAdapter

__all__ = [
    "Base",
    "SessionLocal",
    "engine",
    "get_db",
    "init_db",
    "AggFunc",
    "AggSpec",
    "IDatabaseAdapter",
    "SQLAlchemyDatabaseAdapter",
]
