from typing import Optional
from app.db.models import CurrencyRate
from app.db.adapter import IDatabaseAdapter

class CurrencyRepository:
    """Data access repository for exchange rates operating via IDatabaseAdapter."""

    def __init__(self, db_client: IDatabaseAdapter):
        self.db_client = db_client


    def get_rate(self, currency_code: str) -> Optional[CurrencyRate]:
        """Fetch currency rate record by currency code."""
        return self.db_client.find_one(
            CurrencyRate,
            filters=[CurrencyRate.currency == currency_code.upper()],
        )

    def get_all_rates(self) -> list[CurrencyRate]:
        """Fetch all stored exchange rates."""
        return self.db_client.find_all(CurrencyRate)
