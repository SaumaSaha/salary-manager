import pytest
from fastapi import HTTPException
from app.services.currency_service import CurrencyService

def test_currency_conversion_supported(db):
    """Verify currency conversion for supported currencies (USD, EUR, GBP, INR, JPY, CAD)."""
    service = CurrencyService(db)
    
    # USD
    usd_val = service.calculate_usd_salary(100.0, "USD")
    assert usd_val == 100.0

    # EUR (rate 1.08)
    eur_val = service.calculate_usd_salary(100.0, "EUR")
    assert eur_val == 108.0

    # INR (rate 0.012)
    inr_val = service.calculate_usd_salary(10000.0, "INR")
    assert inr_val == 120.0


def test_currency_conversion_unsupported(db):
    """Verify conversion attempt with unsupported currency raises 422 Unprocessable Entity."""
    service = CurrencyService(db)
    
    with pytest.raises(HTTPException) as exc_info:
        service.calculate_usd_salary(100.0, "XYZ")
    
    assert exc_info.value.status_code == 422
    assert "Unsupported currency" in exc_info.value.detail
