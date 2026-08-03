"""Unit tests for EmployeeRepository — exercised directly against the in-memory DB."""
from datetime import datetime

import pytest

from app.db.adapter import SQLAlchemyDatabaseAdapter
from app.db.models import Employee
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.employee import EmployeeCreate, EmployeeUpdate


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_repo(db) -> EmployeeRepository:
    return EmployeeRepository(SQLAlchemyDatabaseAdapter(db))


def _seed_employee(db, **overrides) -> Employee:
    """Insert a minimal Employee directly and return it."""
    defaults = {
        "first_name": "Jane",
        "last_name": "Doe",
        "email": "jane.doe@acme.com",
        "job_title": "Engineer",
        "department": "Engineering",
        "country": "USA",
        "base_salary": 100_000.0,
        "currency": "USD",
        "usd_salary": 100_000.0,
        "gender": "Female",
        "hire_date": datetime(2023, 1, 1),
    }
    defaults.update(overrides)
    emp = Employee(**defaults)
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

def test_get_by_id_returns_employee(db):
    emp = _seed_employee(db)
    repo = _make_repo(db)
    result = repo.get_by_id(emp.id)
    assert result is not None
    assert result.id == emp.id


def test_get_by_id_missing_returns_none(db):
    repo = _make_repo(db)
    assert repo.get_by_id("nonexistent-id") is None


def test_get_by_email_returns_employee(db):
    _seed_employee(db)
    repo = _make_repo(db)
    result = repo.get_by_email("jane.doe@acme.com")
    assert result is not None
    assert result.email == "jane.doe@acme.com"


def test_get_by_email_missing_returns_none(db):
    repo = _make_repo(db)
    assert repo.get_by_email("nobody@acme.com") is None


def test_create_inserts_employee(db):
    repo = _make_repo(db)
    payload = EmployeeCreate(
        first_name="Bob",
        last_name="Smith",
        email="bob.smith@acme.com",
        job_title="Manager",
        department="Operations",
        country="UK",
        base_salary=80_000.0,
        currency="GBP",
        gender="Male",
        hire_date=datetime(2022, 6, 1),
    )
    emp = repo.create(payload, usd_salary=101_600.0)
    assert emp.id is not None
    assert emp.usd_salary == 101_600.0
    assert emp.email == "bob.smith@acme.com"


def test_update_changes_fields(db):
    emp = _seed_employee(db)
    repo = _make_repo(db)
    updated = repo.update(emp, EmployeeUpdate(job_title="Lead Engineer"))
    assert updated.job_title == "Lead Engineer"


def test_update_recalculates_usd_salary(db):
    emp = _seed_employee(db)
    repo = _make_repo(db)
    updated = repo.update(emp, EmployeeUpdate(base_salary=120_000.0), usd_salary=120_000.0)
    assert updated.usd_salary == 120_000.0


def test_delete_removes_employee(db):
    emp = _seed_employee(db)
    repo = _make_repo(db)
    repo.delete(emp)
    assert repo.get_by_id(emp.id) is None


# ---------------------------------------------------------------------------
# list_paginated — pagination, sorting, and filters
# ---------------------------------------------------------------------------

def _seed_three(db):
    """Seed three employees across different departments and salary bands."""
    emps = [
        _seed_employee(db, first_name="Alice", last_name="A", email="a@a.com",
                       department="Engineering", country="USA", usd_salary=90_000.0),
        _seed_employee(db, first_name="Bob", last_name="B", email="b@b.com",
                       department="Marketing", country="UK", usd_salary=70_000.0),
        _seed_employee(db, first_name="Carol", last_name="C", email="c@c.com",
                       department="Engineering", country="USA", usd_salary=110_000.0),
    ]
    return emps


def test_list_paginated_returns_all(db):
    _seed_three(db)
    repo = _make_repo(db)
    items, total = repo.list_paginated(page=1, page_size=10)
    assert total == 3
    assert len(items) == 3


def test_list_paginated_respects_page_size(db):
    _seed_three(db)
    repo = _make_repo(db)
    items, total = repo.list_paginated(page=1, page_size=2)
    assert total == 3
    assert len(items) == 2


def test_list_paginated_second_page(db):
    _seed_three(db)
    repo = _make_repo(db)
    items, total = repo.list_paginated(page=2, page_size=2)
    assert total == 3
    assert len(items) == 1


def test_list_paginated_filter_by_department(db):
    _seed_three(db)
    repo = _make_repo(db)
    items, total = repo.list_paginated(departments=["Engineering"])
    assert total == 2
    assert all(e.department == "Engineering" for e in items)


def test_list_paginated_filter_by_country(db):
    _seed_three(db)
    repo = _make_repo(db)
    items, total = repo.list_paginated(countries=["UK"])
    assert total == 1
    assert items[0].country == "UK"


def test_list_paginated_filter_by_salary_range(db):
    _seed_three(db)
    repo = _make_repo(db)
    items, total = repo.list_paginated(min_usd_salary=80_000.0, max_usd_salary=100_000.0)
    assert total == 1
    assert items[0].usd_salary == 90_000.0


def test_list_paginated_search_by_name(db):
    _seed_three(db)
    repo = _make_repo(db)
    items, total = repo.list_paginated(search="Alice")
    assert total == 1
    assert items[0].first_name == "Alice"


def test_list_paginated_sort_asc(db):
    _seed_three(db)
    repo = _make_repo(db)
    items, _ = repo.list_paginated(sort_by="usd_salary", sort_order="asc")
    salaries = [e.usd_salary for e in items]
    assert salaries == sorted(salaries)


def test_list_paginated_sort_desc(db):
    _seed_three(db)
    repo = _make_repo(db)
    items, _ = repo.list_paginated(sort_by="usd_salary", sort_order="desc")
    salaries = [e.usd_salary for e in items]
    assert salaries == sorted(salaries, reverse=True)


# ---------------------------------------------------------------------------
# Metadata helpers
# ---------------------------------------------------------------------------

def test_get_departments_returns_unique_sorted(db):
    _seed_three(db)
    repo = _make_repo(db)
    depts = repo.get_departments()
    assert sorted(depts) == depts
    assert set(depts) == {"Engineering", "Marketing"}


def test_get_countries_returns_unique_sorted(db):
    _seed_three(db)
    repo = _make_repo(db)
    countries = repo.get_countries()
    assert sorted(countries) == countries
    assert set(countries) == {"UK", "USA"}


def test_get_salary_range(db):
    _seed_three(db)
    repo = _make_repo(db)
    min_sal, max_sal = repo.get_salary_range()
    assert min_sal == 70_000.0
    assert max_sal == 110_000.0


def test_get_salary_range_empty_db(db):
    repo = _make_repo(db)
    min_sal, max_sal = repo.get_salary_range()
    assert min_sal == 0.0
    assert max_sal == 0.0


# ---------------------------------------------------------------------------
# stream_all_filtered
# ---------------------------------------------------------------------------

def test_stream_all_filtered_yields_all_batches(db):
    _seed_three(db)
    repo = _make_repo(db)
    batches = list(repo.stream_all_filtered(batch_size=2))
    total_yielded = sum(len(b) for b in batches)
    assert total_yielded == 3
    assert len(batches) == 2  # 2 + 1


def test_stream_all_filtered_with_department_filter(db):
    _seed_three(db)
    repo = _make_repo(db)
    batches = list(repo.stream_all_filtered(departments=["Marketing"], batch_size=100))
    all_emps = [e for batch in batches for e in batch]
    assert len(all_emps) == 1
    assert all_emps[0].department == "Marketing"


def test_get_salary_range_empty_result():
    """Verify get_salary_range returns (0.0, 0.0) when aggregate result is an empty list."""
    from unittest.mock import MagicMock
    mock_db = MagicMock()
    mock_db.aggregate.return_value = []
    repo = EmployeeRepository(mock_db)
    assert repo.get_salary_range() == (0.0, 0.0)

