import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db import get_db
from app.db.models import Base, CurrencyRate, Employee

# Create in-memory SQLite database engine for fast, isolated test execution
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(name="db")
def fixture_db():
    """Provides a clean in-memory database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # Pre-populate currency exchange rates
    rates = [
        CurrencyRate(currency="USD", rate_to_usd=1.0, effective_date=datetime(2026, 1, 1)),
        CurrencyRate(currency="EUR", rate_to_usd=1.08, effective_date=datetime(2026, 1, 1)),
        CurrencyRate(currency="GBP", rate_to_usd=1.27, effective_date=datetime(2026, 1, 1)),
        CurrencyRate(currency="INR", rate_to_usd=0.012, effective_date=datetime(2026, 1, 1)),
        CurrencyRate(currency="JPY", rate_to_usd=0.0067, effective_date=datetime(2026, 1, 1)),
        CurrencyRate(currency="CAD", rate_to_usd=0.74, effective_date=datetime(2026, 1, 1)),
    ]
    session.add_all(rates)
    session.commit()
    
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(name="client")
def fixture_client(db):
    """Provides a FastAPI TestClient configured with dependency overrides for the test DB."""
    def _override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(name="sample_employee_payload")
def fixture_sample_employee_payload():
    """Provides a standard employee creation dictionary payload."""
    return {
        "first_name": "Jane",
        "last_name": "Doe",
        "email": "jane.doe@acme.com",
        "job_title": "Senior Software Engineer",
        "department": "Engineering",
        "country": "USA",
        "base_salary": 120000.0,
        "currency": "USD",
        "bonus_percentage": 10.0,
        "gender": "Female",
        "performance": 4,
        "hire_date": "2023-01-15T00:00:00",
    }
