"""Unit tests for AnalyticsRepository — verifies KPI computation, grouping, and schema model output."""
from datetime import datetime

import pytest

from app.db.adapter import SQLAlchemyDatabaseAdapter
from app.db.models import Employee
from app.repositories.analytics_repository import AnalyticsRepository
from app.schemas.analytics import (
    CountryAnalyticsItem,
    DepartmentAnalyticsItem,
    GenderAnalyticsItem,
    KPISummaryResponse,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_repo(db) -> AnalyticsRepository:
    return AnalyticsRepository(SQLAlchemyDatabaseAdapter(db))


def _seed(db, **kwargs) -> Employee:
    defaults = {
        "first_name": "Test",
        "last_name": "User",
        "email": "test@acme.com",
        "job_title": "Analyst",
        "department": "Finance",
        "country": "USA",
        "base_salary": 80_000.0,
        "currency": "USD",
        "usd_salary": 80_000.0,
        "gender": "Female",
        "hire_date": datetime(2023, 1, 1),
    }
    defaults.update(kwargs)
    emp = Employee(**defaults)
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


# ---------------------------------------------------------------------------
# get_kpi_summary — empty and populated states
# ---------------------------------------------------------------------------

def test_kpi_summary_empty_database(db):
    repo = _make_repo(db)
    result = repo.get_kpi_summary()
    assert isinstance(result, KPISummaryResponse)
    assert result.employee_count == 0
    assert result.total_payroll_usd == 0.0
    assert result.average_salary_usd == 0.0
    assert result.median_salary_usd == 0.0
    assert result.highest_salary_usd == 0.0
    assert result.lowest_salary_usd == 0.0


def test_kpi_summary_single_employee(db):
    _seed(db, usd_salary=100_000.0)
    repo = _make_repo(db)
    result = repo.get_kpi_summary()
    assert result.employee_count == 1
    assert result.total_payroll_usd == 100_000.0
    assert result.average_salary_usd == 100_000.0
    assert result.median_salary_usd == 100_000.0
    assert result.highest_salary_usd == 100_000.0
    assert result.lowest_salary_usd == 100_000.0


def test_kpi_summary_odd_count_median(db):
    """Median of [60k, 80k, 100k] should be 80k (middle value)."""
    _seed(db, email="a@a.com", usd_salary=60_000.0)
    _seed(db, email="b@b.com", usd_salary=80_000.0)
    _seed(db, email="c@c.com", usd_salary=100_000.0)
    repo = _make_repo(db)
    result = repo.get_kpi_summary()
    assert result.employee_count == 3
    assert result.median_salary_usd == 80_000.0
    assert result.total_payroll_usd == 240_000.0
    assert result.lowest_salary_usd == 60_000.0
    assert result.highest_salary_usd == 100_000.0


def test_kpi_summary_even_count_median(db):
    """Median of [60k, 100k] should be 80k (average of two middle values)."""
    _seed(db, email="a@a.com", usd_salary=60_000.0)
    _seed(db, email="b@b.com", usd_salary=100_000.0)
    repo = _make_repo(db)
    result = repo.get_kpi_summary()
    assert result.employee_count == 2
    assert result.median_salary_usd == 80_000.0


# ---------------------------------------------------------------------------
# get_by_department
# ---------------------------------------------------------------------------

def test_get_by_department_returns_items(db):
    _seed(db, email="e1@a.com", department="Engineering", usd_salary=100_000.0)
    _seed(db, email="e2@a.com", department="Engineering", usd_salary=120_000.0)
    _seed(db, email="m1@a.com", department="Marketing", usd_salary=80_000.0)
    repo = _make_repo(db)
    items = repo.get_by_department()
    assert all(isinstance(i, DepartmentAnalyticsItem) for i in items)
    depts = {i.department for i in items}
    assert depts == {"Engineering", "Marketing"}


def test_get_by_department_counts_correct(db):
    _seed(db, email="e1@a.com", department="Engineering", usd_salary=100_000.0)
    _seed(db, email="e2@a.com", department="Engineering", usd_salary=120_000.0)
    repo = _make_repo(db)
    items = repo.get_by_department()
    eng = next(i for i in items if i.department == "Engineering")
    assert eng.employee_count == 2
    assert eng.total_payroll_usd == 220_000.0
    assert eng.average_salary_usd == 110_000.0


def test_get_by_department_ordered_by_total_desc(db):
    _seed(db, email="e1@a.com", department="Engineering", usd_salary=200_000.0)
    _seed(db, email="m1@a.com", department="Marketing", usd_salary=50_000.0)
    repo = _make_repo(db)
    items = repo.get_by_department()
    totals = [i.total_payroll_usd for i in items]
    assert totals == sorted(totals, reverse=True)


# ---------------------------------------------------------------------------
# get_by_country
# ---------------------------------------------------------------------------

def test_get_by_country_returns_items(db):
    _seed(db, email="us@a.com", country="USA", usd_salary=100_000.0)
    _seed(db, email="uk@a.com", country="UK", usd_salary=100_000.0)
    repo = _make_repo(db)
    items = repo.get_by_country()
    assert all(isinstance(i, CountryAnalyticsItem) for i in items)
    countries = {i.country for i in items}
    assert countries == {"USA", "UK"}


def test_get_by_country_percentage_sums_to_100(db):
    _seed(db, email="us@a.com", country="USA", usd_salary=60_000.0)
    _seed(db, email="uk@a.com", country="UK", usd_salary=40_000.0)
    repo = _make_repo(db)
    items = repo.get_by_country()
    total_pct = sum(i.percentage_of_payroll for i in items)
    assert abs(total_pct - 100.0) < 0.01


def test_get_by_country_correct_percentage(db):
    _seed(db, email="us@a.com", country="USA", usd_salary=75_000.0)
    _seed(db, email="uk@a.com", country="UK", usd_salary=25_000.0)
    repo = _make_repo(db)
    items = repo.get_by_country()
    usa = next(i for i in items if i.country == "USA")
    assert usa.percentage_of_payroll == 75.0


# ---------------------------------------------------------------------------
# get_by_gender
# ---------------------------------------------------------------------------

def test_get_by_gender_returns_items(db):
    _seed(db, email="f@a.com", gender="Female", usd_salary=90_000.0)
    _seed(db, email="m@a.com", gender="Male", usd_salary=110_000.0)
    repo = _make_repo(db)
    items = repo.get_by_gender()
    assert all(isinstance(i, GenderAnalyticsItem) for i in items)
    genders = {i.gender for i in items}
    assert genders == {"Female", "Male"}


def test_get_by_gender_average_salary_correct(db):
    _seed(db, email="f1@a.com", gender="Female", usd_salary=80_000.0)
    _seed(db, email="f2@a.com", gender="Female", usd_salary=100_000.0)
    repo = _make_repo(db)
    items = repo.get_by_gender()
    female = next(i for i in items if i.gender == "Female")
    assert female.employee_count == 2
    assert female.average_salary_usd == 90_000.0
    assert female.total_payroll_usd == 180_000.0
