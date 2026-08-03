from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.analytics import (
    CountryAnalyticsResponse,
    DepartmentAnalyticsResponse,
    GenderAnalyticsResponse,
    KPISummaryResponse,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=KPISummaryResponse)
def get_kpi_summary(db: Session = Depends(get_db)):
    """Fetch executive KPI summary metrics (Total Payroll, Average, Median, Min, Max, Headcount)."""
    service = AnalyticsService(db)
    return service.get_kpi_summary()


@router.get("/by-department", response_model=DepartmentAnalyticsResponse)
def get_analytics_by_department(db: Session = Depends(get_db)):
    """Fetch salary analytics grouped by department."""
    service = AnalyticsService(db)
    return service.get_by_department()


@router.get("/by-country", response_model=CountryAnalyticsResponse)
def get_analytics_by_country(db: Session = Depends(get_db)):
    """Fetch salary analytics grouped by country."""
    service = AnalyticsService(db)
    return service.get_by_country()


@router.get("/by-gender", response_model=GenderAnalyticsResponse)
def get_analytics_by_gender(db: Session = Depends(get_db)):
    """Fetch pay parity metrics grouped by gender."""
    service = AnalyticsService(db)
    return service.get_by_gender()
