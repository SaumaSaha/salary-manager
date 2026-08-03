import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, Float, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base

class Employee(Base):
    """Employee database model mapping to the employees table."""
    __tablename__ = "employees"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    job_title: Mapped[str] = mapped_column(String(150), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    base_salary: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    usd_salary: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    bonus_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    performance: Mapped[int] = mapped_column(Integer, default=3)
    hire_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        Index("idx_employee_name", "last_name", "first_name"),
    )


class CurrencyRate(Base):
    """Currency rates table for converting local base salary to normalized USD salary."""
    __tablename__ = "currency_rates"

    currency: Mapped[str] = mapped_column(String(10), primary_key=True)
    rate_to_usd: Mapped[float] = mapped_column(Float, nullable=False)
    effective_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )
