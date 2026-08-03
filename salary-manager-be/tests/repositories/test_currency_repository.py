"""Unit tests for CurrencyRepository — verifies rate lookup and full-list retrieval."""
import pytest

from app.db.adapter import SQLAlchemyDatabaseAdapter
from app.db.models import CurrencyRate
from app.repositories.currency_repository import CurrencyRepository


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_repo(db) -> CurrencyRepository:
    return CurrencyRepository(SQLAlchemyDatabaseAdapter(db))


# ---------------------------------------------------------------------------
# get_rate
# ---------------------------------------------------------------------------

def test_get_rate_returns_existing_rate(db):
    """conftest pre-seeds USD, EUR, GBP, INR, JPY, CAD — all should resolve."""
    repo = _make_repo(db)
    rate = repo.get_rate("USD")
    assert rate is not None
    assert rate.currency == "USD"
    assert rate.rate_to_usd == 1.0


def test_get_rate_is_case_insensitive(db):
    """Currency codes should be upper-cased before lookup."""
    repo = _make_repo(db)
    lower = repo.get_rate("usd")
    upper = repo.get_rate("USD")
    assert lower is not None
    assert upper is not None
    assert lower.currency == upper.currency


def test_get_rate_returns_none_for_unknown_currency(db):
    repo = _make_repo(db)
    assert repo.get_rate("XYZ") is None


def test_get_rate_gbp(db):
    repo = _make_repo(db)
    rate = repo.get_rate("GBP")
    assert rate is not None
    assert rate.rate_to_usd == 1.27


def test_get_rate_inr(db):
    repo = _make_repo(db)
    rate = repo.get_rate("INR")
    assert rate is not None
    assert rate.rate_to_usd == 0.012


# ---------------------------------------------------------------------------
# get_all_rates
# ---------------------------------------------------------------------------

def test_get_all_rates_returns_all_seeded(db):
    """conftest seeds 6 currency rates — all should be returned."""
    repo = _make_repo(db)
    rates = repo.get_all_rates()
    assert len(rates) == 6
    assert all(isinstance(r, CurrencyRate) for r in rates)


def test_get_all_rates_contains_expected_codes(db):
    repo = _make_repo(db)
    codes = {r.currency for r in repo.get_all_rates()}
    assert {"USD", "EUR", "GBP", "INR", "JPY", "CAD"} == codes
