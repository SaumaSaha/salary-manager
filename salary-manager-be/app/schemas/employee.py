from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class EmployeeBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    job_title: str = Field(..., min_length=1, max_length=150)
    department: str = Field(..., min_length=1, max_length=100)
    country: str = Field(..., min_length=1, max_length=100)
    base_salary: float = Field(..., gt=0)
    currency: str = Field(..., min_length=3, max_length=10)
    bonus_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    gender: str = Field(..., min_length=1, max_length=20)
    performance: int = Field(default=3, ge=1, le=5)
    hire_date: datetime


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    job_title: Optional[str] = Field(None, min_length=1, max_length=150)
    department: Optional[str] = Field(None, min_length=1, max_length=100)
    country: Optional[str] = Field(None, min_length=1, max_length=100)
    base_salary: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=10)
    bonus_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    gender: Optional[str] = Field(None, min_length=1, max_length=20)
    performance: Optional[int] = Field(None, ge=1, le=5)
    hire_date: Optional[datetime] = None


class EmployeeResponse(EmployeeBase):
    id: str
    usd_salary: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total_records: int
    total_pages: int


class EmployeeListResponse(BaseModel):
    items: list[EmployeeResponse]
    pagination: PaginationMeta
