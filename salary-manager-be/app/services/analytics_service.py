from sqlalchemy.orm import Session
from app.repositories.analytics_repository import AnalyticsRepository
from app.db.adapter import SQLAlchemyDatabaseAdapter
from app.schemas.analytics import (
    CountryAnalyticsResponse,
    DepartmentAnalyticsResponse,
    GenderAnalyticsResponse,
    KPISummaryResponse,
)

class AnalyticsService:
    """Service wrapping analytics data aggregations."""

    def __init__(self, db: Session):
        self.repo = AnalyticsRepository(SQLAlchemyDatabaseAdapter(db))

    def get_kpi_summary(self) -> KPISummaryResponse:
        """Fetch high-level KPI summary cards."""
        return self.repo.get_kpi_summary()

    def get_by_department(self) -> DepartmentAnalyticsResponse:
        """Fetch departmental aggregate metrics."""
        return DepartmentAnalyticsResponse(items=self.repo.get_by_department())

    def get_by_country(self) -> CountryAnalyticsResponse:
        """Fetch country distribution aggregate metrics."""
        return CountryAnalyticsResponse(items=self.repo.get_by_country())

    def get_by_gender(self) -> GenderAnalyticsResponse:
        """Fetch gender pay parity aggregate metrics."""
        return GenderAnalyticsResponse(items=self.repo.get_by_gender())
