from typing import Generator, Optional

from app.db.models import Employee
from app.db.adapter import AggFunc, AggSpec, IDatabaseAdapter
from app.schemas.employee import EmployeeCreate, EmployeeUpdate


class EmployeeRepository:
    """Repository handling database operations for Employee records via IDatabaseAdapter."""

    def __init__(self, db_client: IDatabaseAdapter):
        self.db_client = db_client

    def get_by_id(self, employee_id: str) -> Optional[Employee]:
        """Fetch employee by UUID primary key."""
        return self.db_client.find_one(Employee, filters=[Employee.id == employee_id])

    def get_by_email(self, email: str) -> Optional[Employee]:
        """Fetch employee by corporate email."""
        return self.db_client.find_one(Employee, filters=[Employee.email == email])

    def create(self, employee_data: EmployeeCreate, usd_salary: float) -> Employee:
        """Insert a new employee record."""
        data_dict = employee_data.model_dump()
        data_dict["usd_salary"] = usd_salary
        return self.db_client.save(Employee, data_dict)

    def update(
        self, employee: Employee, update_data: EmployeeUpdate, usd_salary: Optional[float] = None
    ) -> Employee:
        """Update existing employee record."""
        changes = update_data.model_dump(exclude_unset=True)
        if usd_salary is not None:
            changes["usd_salary"] = usd_salary
        return self.db_client.update(Employee, filters=[Employee.id == employee.id], data_dict=changes)

    def delete(self, employee: Employee) -> None:
        """Delete an employee record."""
        self.db_client.delete(Employee, filters=[Employee.id == employee.id])

    def _build_filter_list(
        self,
        search: Optional[str] = None,
        departments: Optional[list[str]] = None,
        countries: Optional[list[str]] = None,
        min_usd_salary: Optional[float] = None,
        max_usd_salary: Optional[float] = None,
    ) -> list:
        """Build list of search and range filter expressions."""
        filters = []
        if search:
            pattern = f"%{search.strip()}%"
            filters.append(
                self.db_client.ilike_search(
                    Employee,
                    fields=["first_name", "last_name", "email", "job_title"],
                    pattern=pattern,
                )
            )

        if departments:
            filters.append(Employee.department.in_(departments))
        if countries:
            filters.append(Employee.country.in_(countries))
        if min_usd_salary is not None:
            filters.append(Employee.usd_salary >= min_usd_salary)
        if max_usd_salary is not None:
            filters.append(Employee.usd_salary <= max_usd_salary)

        return filters

    def list_paginated(
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
    ) -> tuple[list[Employee], int]:
        """Fetch paginated, filtered, and sorted employee list with total record count."""
        filters = self._build_filter_list(
            search=search,
            departments=departments,
            countries=countries,
            min_usd_salary=min_usd_salary,
            max_usd_salary=max_usd_salary,
        )

        total_records = self.db_client.count(Employee, filters=filters)
        offset = (page - 1) * page_size

        items = self.db_client.find_all(
            Employee,
            filters=filters,
            sort_col=sort_by,
            sort_order=sort_order,
            offset=offset,
            limit=page_size,
        )

        return items, total_records

    def get_departments(self) -> list[str]:
        """Get unique department list from database."""
        results = self.db_client.aggregate(
            Employee,
            aggs=["department"],
            group_by=["department"],
            order_by=["department"],
        )
        return [r[0] for r in results]

    def get_countries(self) -> list[str]:
        """Get unique country list from database."""
        results = self.db_client.aggregate(
            Employee,
            aggs=["country"],
            group_by=["country"],
            order_by=["country"],
        )
        return [r[0] for r in results]

    def get_salary_range(self) -> tuple[float, float]:
        """Get min and max usd_salary from database."""
        results = self.db_client.aggregate(
            Employee,
            aggs=[
                AggSpec(AggFunc.MIN, "usd_salary"),
                AggSpec(AggFunc.MAX, "usd_salary"),
            ],
        )
        if results and results[0]:
            min_val = results[0][0] if results[0][0] is not None else 0.0
            max_val = results[0][1] if results[0][1] is not None else 0.0
            return min_val, max_val
        return 0.0, 0.0

    def stream_all_filtered(
        self,
        search: Optional[str] = None,
        departments: Optional[list[str]] = None,
        countries: Optional[list[str]] = None,
        min_usd_salary: Optional[float] = None,
        max_usd_salary: Optional[float] = None,
        batch_size: int = 1000,
    ) -> Generator[list[Employee], None, None]:
        """Stream filtered employees in batches for low-memory CSV export."""
        filters = self._build_filter_list(
            search=search,
            departments=departments,
            countries=countries,
            min_usd_salary=min_usd_salary,
            max_usd_salary=max_usd_salary,
        )
        return self.db_client.stream_batches(
            Employee,
            filters=filters,
            sort_col="id",
            batch_size=batch_size,
        )
