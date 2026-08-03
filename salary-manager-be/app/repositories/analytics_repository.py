from app.db.models import Employee
from app.db.adapter import AggFunc, AggSpec, IDatabaseAdapter
from app.schemas.analytics import (
    CountryAnalyticsItem,
    DepartmentAnalyticsItem,
    GenderAnalyticsItem,
    KPISummaryResponse,
)


class AnalyticsRepository:
    """Repository executing database aggregations for dashboard metrics via IDatabaseAdapter."""

    def __init__(self, db_client: IDatabaseAdapter):
        self.db_client = db_client

    def get_kpi_summary(self) -> KPISummaryResponse:
        """Compute total payroll, average, min, max, count, and median USD salary."""
        count = self.db_client.count(Employee)
        if count == 0:
            return KPISummaryResponse(
                total_payroll_usd=0.0,
                average_salary_usd=0.0,
                median_salary_usd=0.0,
                employee_count=0,
                highest_salary_usd=0.0,
                lowest_salary_usd=0.0,
            )

        stats = self.db_client.aggregate(
            Employee,
            aggs=[
                AggSpec(AggFunc.SUM, "usd_salary"),
                AggSpec(AggFunc.AVG, "usd_salary"),
                AggSpec(AggFunc.MIN, "usd_salary"),
                AggSpec(AggFunc.MAX, "usd_salary"),
            ],
        )

        first_stat = stats[0] if stats else (0.0, 0.0, 0.0, 0.0)
        total = first_stat[0] or 0.0
        avg = first_stat[1] or 0.0
        min_val = first_stat[2] or 0.0
        max_val = first_stat[3] or 0.0

        # Compute median salary using find_all pagination bounds
        if count % 2 == 1:
            median_offset = count // 2
            med_items = self.db_client.find_all(
                Employee,
                sort_col="usd_salary",
                sort_order="asc",
                offset=median_offset,
                limit=1,
            )
            median_val = med_items[0].usd_salary if med_items else avg
        else:
            median_offset = (count // 2) - 1
            med_items = self.db_client.find_all(
                Employee,
                sort_col="usd_salary",
                sort_order="asc",
                offset=median_offset,
                limit=2,
            )
            if len(med_items) == 2:
                median_val = (med_items[0].usd_salary + med_items[1].usd_salary) / 2.0
            else:
                median_val = avg

        return KPISummaryResponse(
            total_payroll_usd=float(total),
            average_salary_usd=float(avg),
            median_salary_usd=float(median_val or 0.0),
            employee_count=count,
            highest_salary_usd=float(max_val),
            lowest_salary_usd=float(min_val),
        )

    def get_by_department(self) -> list[DepartmentAnalyticsItem]:
        """Aggregate headcount, total spend, and average salary per department."""
        results = self.db_client.aggregate(
            Employee,
            aggs=[
                "department",
                AggSpec(AggFunc.COUNT, "id"),
                AggSpec(AggFunc.SUM, "usd_salary"),
                AggSpec(AggFunc.AVG, "usd_salary"),
            ],
            group_by=["department"],
            order_by=[AggSpec(AggFunc.SUM, "usd_salary")],
            order_desc=True,
        )
        return [
            DepartmentAnalyticsItem(
                department=r[0],
                employee_count=r[1],
                total_payroll_usd=float(r[2] or 0.0),
                average_salary_usd=float(r[3] or 0.0),
            )
            for r in results
        ]

    def get_by_country(self) -> list[CountryAnalyticsItem]:
        """Aggregate headcount and payroll distribution by country."""
        tot_res = self.db_client.aggregate(
            Employee,
            aggs=[AggSpec(AggFunc.SUM, "usd_salary")],
        )
        total_payroll = tot_res[0][0] if tot_res and tot_res[0][0] else 1.0

        results = self.db_client.aggregate(
            Employee,
            aggs=[
                "country",
                AggSpec(AggFunc.COUNT, "id"),
                AggSpec(AggFunc.SUM, "usd_salary"),
            ],
            group_by=["country"],
            order_by=[AggSpec(AggFunc.SUM, "usd_salary")],
            order_desc=True,
        )
        return [
            CountryAnalyticsItem(
                country=r[0],
                employee_count=r[1],
                total_payroll_usd=float(r[2] or 0.0),
                percentage_of_payroll=float(
                    round(((r[2] or 0.0) / total_payroll) * 100, 2)
                ),
            )
            for r in results
        ]

    def get_by_gender(self) -> list[GenderAnalyticsItem]:
        """Aggregate compensation by gender for pay equity insights."""
        results = self.db_client.aggregate(
            Employee,
            aggs=[
                "gender",
                AggSpec(AggFunc.COUNT, "id"),
                AggSpec(AggFunc.AVG, "usd_salary"),
                AggSpec(AggFunc.SUM, "usd_salary"),
            ],
            group_by=["gender"],
            order_by=["gender"],
        )
        return [
            GenderAnalyticsItem(
                gender=r[0],
                employee_count=r[1],
                average_salary_usd=float(r[2] or 0.0),
                total_payroll_usd=float(r[3] or 0.0),
            )
            for r in results
        ]
