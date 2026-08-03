from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.currency_repository import CurrencyRepository
from app.db.adapter import SQLAlchemyDatabaseAdapter

class CurrencyService:
    """Business service for exchange rate caching and USD normalization."""

    def __init__(self, db: Session):
        self.repo = CurrencyRepository(SQLAlchemyDatabaseAdapter(db))
        self._cache: dict[str, float] = {}

    def get_rate(self, currency_code: str) -> float:
        """Fetch currency exchange rate to USD with in-memory caching."""
        code = currency_code.strip().upper()

        if code in self._cache:
            return self._cache[code]

        rate_obj = self.repo.get_rate(code)
        if not rate_obj:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Unsupported currency: {currency_code}. Exchange rate not available.",
            )

        rate = float(rate_obj.rate_to_usd)
        self._cache[code] = rate
        return rate

    def calculate_usd_salary(self, base_salary: float, currency_code: str) -> float:
        """Calculate normalized USD salary based on currency conversion rate."""
        rate = self.get_rate(currency_code)
        return float(round(base_salary * rate, 2))
