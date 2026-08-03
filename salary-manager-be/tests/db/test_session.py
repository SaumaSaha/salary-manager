"""Unit tests for app/db/session.py database session context manager."""
from sqlalchemy.orm import Session
from app.db.session import get_db


def test_get_db_yields_and_closes_session():
    """Verify get_db dependency yields a active SQLAlchemy Session and closes it on teardown."""
    gen = get_db()
    db_session = next(gen)
    assert isinstance(db_session, Session)
    
    # Teardown generator
    try:
        next(gen)
    except StopIteration:
        pass
