import csv
import io
import math
from typing import Generator, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import Employee
from app.db.adapter import SQLAlchemyDatabaseAdapter
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.employee import EmployeeCreate, EmployeeListResponse, EmployeeUpdate, PaginationMeta
from app.services.currency_service import CurrencyService

class EmployeeService:
    """Service handling business rules, validation, and CSV formatting for employees."""

    def __init__(self, db: Session):
        self.db = db
        adapter = SQLAlchemyDatabaseAdapter(db)
        self.repo = EmployeeRepository(adapter)
        self.currency_service = CurrencyService(db)

    def get_employee(self, employee_id: str) -> Employee:
        """Fetch employee by ID or raise 404 Not Found."""
        employee = self.repo.get_by_id(employee_id)
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee with ID '{employee_id}' not found.",
            )
        return employee

    def create_employee(self, employee_data: EmployeeCreate) -> Employee:
        """Create a new employee record after validating email uniqueness and computing USD salary."""
        existing = self.repo.get_by_email(employee_data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"An employee with email '{employee_data.email}' is already registered.",
            )

        usd_salary = self.currency_service.calculate_usd_salary(
            employee_data.base_salary, employee_data.currency
        )

        return self.repo.create(employee_data, usd_salary)

    def update_employee(self, employee_id: str, update_data: EmployeeUpdate) -> Employee:
        """Update an existing employee. Recalculates USD salary if salary or currency changes."""
        employee = self.get_employee(employee_id)

        # Validate unique email if changing
        if update_data.email and update_data.email != employee.email:
            existing = self.repo.get_by_email(update_data.email)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"An employee with email '{update_data.email}' is already registered.",
                )

        # Check if USD recalculation is needed
        new_base = update_data.base_salary if update_data.base_salary is not None else employee.base_salary
        new_curr = update_data.currency if update_data.currency is not None else employee.currency

        usd_salary = None
        if update_data.base_salary is not None or update_data.currency is not None:
            usd_salary = self.currency_service.calculate_usd_salary(new_base, new_curr)

        return self.repo.update(employee, update_data, usd_salary=usd_salary)

    def delete_employee(self, employee_id: str) -> None:
        """Delete employee record by ID."""
        employee = self.get_employee(employee_id)
        self.repo.delete(employee)

    def list_employees(
        self,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "last_name",
        sort_order: str = "asc",
        search: Optional[str] = None,
        departments: Optional[list[str]] = None,
        countries: Optional[list[str]] = None,
        min_usd_salary: Optional[float] = None,
        max_usd_salary: Optional[float] = None,
    ) -> EmployeeListResponse:
        """Get paginated employee list with filter/sort state."""
        items, total_records = self.repo.list_paginated(
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order,
            search=search,
            departments=departments,
            countries=countries,
            min_usd_salary=min_usd_salary,
            max_usd_salary=max_usd_salary,
        )

        total_pages = math.ceil(total_records / page_size) if total_records > 0 else 0

        pagination = PaginationMeta(
            page=page,
            page_size=page_size,
            total_records=total_records,
            total_pages=total_pages,
        )

        return EmployeeListResponse(items=items, pagination=pagination)

    def get_departments(self) -> list[str]:
        """Fetch unique departments."""
        return self.repo.get_departments()

    def get_countries(self) -> list[str]:
        """Fetch unique countries."""
        return self.repo.get_countries()

    def get_salary_range(self) -> tuple[float, float]:
        """Fetch min and max usd_salary."""
        return self.repo.get_salary_range()

    def stream_csv_export(
        self,
        search: Optional[str] = None,
        departments: Optional[list[str]] = None,
        countries: Optional[list[str]] = None,
        min_usd_salary: Optional[float] = None,
        max_usd_salary: Optional[float] = None,
    ) -> Generator[str, None, None]:
        """Generator yielding CSV rows in chunks for memory-efficient streaming download."""
        output = io.StringIO()
        writer = csv.writer(output)

        # Write Header Row
        headers = [
            "id",
            "first_name",
            "last_name",
            "email",
            "job_title",
            "department",
            "country",
            "base_salary",
            "currency",
            "usd_salary",
            "bonus_percentage",
            "gender",
            "performance",
            "hire_date",
            "created_at",
            "updated_at",
        ]
        writer.writerow(headers)
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)

        # Stream records in batches of 1,000
        for batch in self.repo.stream_all_filtered(
            search=search,
            departments=departments,
            countries=countries,
            min_usd_salary=min_usd_salary,
            max_usd_salary=max_usd_salary,
            batch_size=1000,
        ):
            for emp in batch:
                writer.writerow([
                    emp.id,
                    emp.first_name,
                    emp.last_name,
                    emp.email,
                    emp.job_title,
                    emp.department,
                    emp.country,
                    emp.base_salary,
                    emp.currency,
                    emp.usd_salary,
                    emp.bonus_percentage,
                    emp.gender,
                    emp.performance,
                    emp.hire_date.isoformat() if emp.hire_date else "",
                    emp.created_at.isoformat() if emp.created_at else "",
                    emp.updated_at.isoformat() if emp.updated_at else "",
                ])
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)
