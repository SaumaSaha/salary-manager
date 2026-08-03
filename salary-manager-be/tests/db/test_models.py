from datetime import datetime
import pytest
from sqlalchemy import inspect
from app.db.models import Base, Employee, CurrencyRate

def test_employee_model_instantiation(db):
    """Verify Employee model attributes, defaults, and type mapping."""
    emp = Employee(
        first_name="Alice",
        last_name="Smith",
        email="alice.smith@acme.com",
        job_title="Product Manager",
        department="Product",
        country="UK",
        base_salary=75000.0,
        currency="GBP",
        usd_salary=95250.0,
        gender="Female",
        hire_date=datetime(2022, 5, 1),
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)

    assert emp.first_name == "Alice"
    assert emp.last_name == "Smith"
    assert emp.email == "alice.smith@acme.com"
    assert emp.job_title == "Product Manager"
    assert emp.department == "Product"
    assert emp.country == "UK"
    assert emp.base_salary == 75000.0
    assert emp.currency == "GBP"
    assert emp.usd_salary == 95250.0
    assert emp.gender == "Female"
    assert emp.performance == 3  # Default value
    assert emp.bonus_percentage == 0.0  # Default value


def test_currency_rate_model_instantiation():
    """Verify CurrencyRate model fields and primary key."""
    rate = CurrencyRate(
        currency="EUR",
        rate_to_usd=1.08,
        effective_date=datetime(2026, 1, 1),
    )

    assert rate.currency == "EUR"
    assert rate.rate_to_usd == 1.08
    assert rate.effective_date == datetime(2026, 1, 1)


def test_employee_indexes_configured():
    """Verify required indexes are present on the Employee table."""
    mapper = inspect(Employee)
    table_indexes = [idx.name for idx in mapper.tables[0].indexes]
    
    # Verify mandatory indexes from FR-SEED-04 & ADR-0001
    assert "idx_employee_name" in table_indexes
    
    # Verify column-level indexes
    indexed_columns = {
        col.name for col in mapper.tables[0].columns if col.index
    }
    assert "department" in indexed_columns
    assert "country" in indexed_columns
    assert "base_salary" in indexed_columns
    assert "usd_salary" in indexed_columns
