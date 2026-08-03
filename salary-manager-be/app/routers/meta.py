from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.meta import CountriesResponse, DepartmentsResponse, SalaryRangeResponse
from app.services.employee_service import EmployeeService

router = APIRouter(prefix="/meta", tags=["Metadata"])


@router.get("/departments", response_model=DepartmentsResponse)
def get_departments(db: Session = Depends(get_db)):
    """Fetch unique department names for UI dropdown options."""
    service = EmployeeService(db)
    return DepartmentsResponse(departments=service.get_departments())


@router.get("/countries", response_model=CountriesResponse)
def get_countries(db: Session = Depends(get_db)):
    """Fetch unique country names for UI dropdown options."""
    service = EmployeeService(db)
    return CountriesResponse(countries=service.get_countries())


@router.get("/salary-range", response_model=SalaryRangeResponse)
def get_salary_range(db: Session = Depends(get_db)):
    """Fetch global minimum and maximum USD salary bounds for UI range slider."""
    service = EmployeeService(db)
    min_sal, max_sal = service.get_salary_range()
    return SalaryRangeResponse(min_usd_salary=min_sal, max_usd_salary=max_sal)
