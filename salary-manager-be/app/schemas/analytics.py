from pydantic import BaseModel

class KPISummaryResponse(BaseModel):
    total_payroll_usd: float
    average_salary_usd: float
    median_salary_usd: float
    employee_count: int
    highest_salary_usd: float
    lowest_salary_usd: float


class DepartmentAnalyticsItem(BaseModel):
    department: str
    employee_count: int
    total_payroll_usd: float
    average_salary_usd: float


class DepartmentAnalyticsResponse(BaseModel):
    items: list[DepartmentAnalyticsItem]


class CountryAnalyticsItem(BaseModel):
    country: str
    employee_count: int
    total_payroll_usd: float
    percentage_of_payroll: float


class CountryAnalyticsResponse(BaseModel):
    items: list[CountryAnalyticsItem]


class GenderAnalyticsItem(BaseModel):
    gender: str
    employee_count: int
    average_salary_usd: float
    total_payroll_usd: float


class GenderAnalyticsResponse(BaseModel):
    items: list[GenderAnalyticsItem]
