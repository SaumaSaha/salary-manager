from pydantic import BaseModel

class DepartmentsResponse(BaseModel):
    departments: list[str]


class CountriesResponse(BaseModel):
    countries: list[str]


class SalaryRangeResponse(BaseModel):
    min_usd_salary: float
    max_usd_salary: float
