from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.employee import EmployeeCreate, EmployeeListResponse, EmployeeResponse, EmployeeUpdate
from app.services.employee_service import EmployeeService

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.get("", response_model=EmployeeListResponse)
def list_employees(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Records per page"),
    sort_by: str = Query("last_name", description="Column to sort by"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$", description="Sort direction"),
    search: Optional[str] = Query(None, description="Global search query"),
    department: Optional[list[str]] = Query(None, description="Department filter(s)"),
    country: Optional[list[str]] = Query(None, description="Country filter(s)"),
    min_usd_salary: Optional[float] = Query(None, ge=0, description="Minimum USD salary"),
    max_usd_salary: Optional[float] = Query(None, ge=0, description="Maximum USD salary"),
    db: Session = Depends(get_db),
):
    """Fetch paginated, filtered, and sorted employee list."""
    service = EmployeeService(db)
    return service.list_employees(
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
        search=search,
        departments=department,
        countries=country,
        min_usd_salary=min_usd_salary,
        max_usd_salary=max_usd_salary,
    )


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
):
    """Create a new employee record."""
    service = EmployeeService(db)
    return service.create_employee(payload)


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: str,
    db: Session = Depends(get_db),
):
    """Get single employee by ID."""
    service = EmployeeService(db)
    return service.get_employee(employee_id)


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: str,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
):
    """Update employee details."""
    service = EmployeeService(db)
    return service.update_employee(employee_id, payload)


@router.delete("/{employee_id}")
def delete_employee(
    employee_id: str,
    db: Session = Depends(get_db),
):
    """Delete an employee by ID."""
    service = EmployeeService(db)
    service.delete_employee(employee_id)
    return {"message": "Employee deleted successfully"}
