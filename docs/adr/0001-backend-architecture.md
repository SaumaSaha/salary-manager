# ADR 0001: Backend Framework, Database Schema, and Data Architecture

## Status
Accepted

## Context
ACME Org requires a backend system to manage salary records for 10,000 employees across multiple global offices. The system must support:
- Sub-50ms response times for server-side pagination, multi-field filtering, and text search across 10,000 records.
- Real-time aggregate analytics (total payroll, average/median salary by department, country, and gender pay equity).
- Data CRUD operations with validation.
- Fast, reproducible data seeding script for 10,000 employees.

## Decision Drivers
1. **Performance & Low Latency**: 10,000 records must query instantaneously without memory leaks or UI freeze.
2. **Developer Experience & Maintainability**: Clean, type-safe architecture with easy local setup (zero complex cloud DB provisioning needed).
3. **Robust Seeding**: Deterministic seed script executing in under 5 seconds using bulk inserts.
4. **Testability**: Fast pytest suite covering analytics aggregations, query filters, and API endpoints.

## Considered Options
1. **Python (FastAPI) + SQLAlchemy 2.0 + Pydantic v2 + SQLite** *(Selected)*
2. **Node.js (TypeScript) + Express + Prisma ORM + SQLite**
3. **Python (Django / Django REST Framework) + SQLite**

## Decision: Python (FastAPI) + SQLAlchemy 2.0 + Pydantic v2 + SQLite

We select **Python (FastAPI) with SQLAlchemy 2.0 ORM, Pydantic v2 validation, and SQLite**.

### Rationale:
- **FastAPI Performance & Auto-Docs**: High-performance asynchronous API framework built on Starlette and Pydantic. Provides automatic OpenAPI / Swagger interactive documentation (`/docs`).
- **SQLAlchemy 2.0 ORM**: Type-safe Python ORM supporting both sync and async query execution, bulk `insert()`, and clean database expression constructs for aggregate functions (`func.avg`, `func.sum`, `func.count`).
- **Pydantic v2**: High-speed Rust-backed data validation for incoming CRUD requests and outgoing JSON serialization.
- **Indexed Queries**: Indexing `department`, `country`, `base_salary`, `usd_salary`, and `last_name, first_name` guarantees sub-10ms search and filter execution over 10,000 records in SQLite.
- **Fast Seeding**: SQLAlchemy bulk `insert()` with `faker` populates 10,000 employee records in < 2 seconds.
- **Pytest Ecosystem**: Powerful testing framework for unit and API integration testing with `httpx` / `TestClient`.

## Database Schema Design (SQLAlchemy 2.0)

```python
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, Index
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    job_title: Mapped[str] = mapped_column(String(150), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    base_salary: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    currency: Mapped[str] = mapped_column(String(10), nullable=False) # USD, EUR, GBP, INR, JPY, CAD
    usd_salary: Mapped[float] = mapped_column(Float, nullable=False, index=True) # Normalized for analytics
    bonus_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    performance: Mapped[int] = mapped_column(Integer, default=3) # 1 to 5 scale
    hire_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_employee_name", "last_name", "first_name"),
    )

class CurrencyRate(Base):
    __tablename__ = "currency_rates"

    currency: Mapped[str] = mapped_column(String(10), primary_key=True)   # EUR, GBP, INR...
    rate_to_usd: Mapped[float] = mapped_column(Float, nullable=False)     # 1 EUR = 1.08 USD
    effective_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

## Consequences

### Positive:
- Clean, modern Python architecture with automatic OpenAPI documentation.
- Instant analytics computation using database-level aggregates.
- Pytest integration for fast, deterministic unit and integration tests.

### Negative / Mitigations:
- Python GIL considerations for heavy CPU compute.
  - *Mitigation*: Analytics calculations are offloaded directly to SQLite's C-engine via SQL aggregate expressions (`SUM`, `AVG`, `COUNT`), ensuring near-instant execution.
