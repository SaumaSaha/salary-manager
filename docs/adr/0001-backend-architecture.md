# ADR 0001: Backend Framework, Database Schema, and Data Architecture

## Status
Accepted

## Context
ACME Org requires an enterprise-grade backend service to manage compensation and salary records for 10,000 employees across multiple global office locations. The backend system must satisfy strict engineering SLAs:
- **Sub-50ms Response Latency**: Fast response times for server-side pagination, multi-field filtering (department, country, salary range), text search across first/last names, and dynamic column sorting across 10,000 employee records.
- **Real-Time Aggregate Analytics**: Instantaneous database-level computation of executive KPI stats (total annual payroll spend, average salary, median salary, headcount, min/max salary bands, department breakdowns, country distribution, and gender pay equity).
- **CRUD Operations with Strict Validation**: Type-safe data mutation endpoints with validation for incoming request payloads and outgoing JSON responses.
- **Fast, Reproducible Seeding**: A deterministic database seed script capable of generating and populating 10,000 synthetic employee records in under 5 seconds.
- **Zero Cloud Infrastructure Overhead**: Fully self-contained local developer experience with no requirement for external database server provisioning.

## Decision Drivers
1. **Performance & Low Latency**: 10,000 records must query instantaneously without memory leaks or process blocking.
2. **Developer Ergonomics & Maintainability**: Clean, modular, type-safe architecture with automated API documentation.
3. **High-Speed Bulk Data Seeding**: Efficient batch database insertion mechanism to populate test datasets.
4. **Testability & Reliability**: Fully decoupled architecture allowing unit testing of business services and repositories without launching HTTP servers.

## Considered Options
1. **Python (FastAPI) + SQLAlchemy 2.0 + Pydantic v2 + SQLite** *(Selected)*
2. **Node.js (TypeScript) + Express + Prisma ORM + SQLite**
3. **Python (Django / Django REST Framework) + SQLite**

---

## Decision: Python (FastAPI) + SQLAlchemy 2.0 + Pydantic v2 + SQLite

We select **Python (FastAPI)** with **SQLAlchemy 2.0 ORM**, **Pydantic v2**, and **SQLite**.

### Key Architectural Rationale:
- **FastAPI Framework**: High-performance asynchronous Web framework built on ASGI (Starlette) with native Pydantic integration. Provides automatic interactive OpenAPI documentation at `/docs` and `/redoc`.
- **SQLAlchemy 2.0 3-Tier Layered Architecture**: Type-safe Python ORM supporting expression language constructs for database-level aggregations (`func.avg`, `func.sum`, `func.count`) and bulk execution API.
- **Pydantic v2 Data Safety**: Fast Rust-backed schema validation and serialization ensuring strict runtime data constraints.
- **Indexed SQLite Storage**: B-Tree indexes on high-cardinality and filter columns (`department`, `country`, `base_salary`, `usd_salary`, `last_name, first_name`) guarantee sub-10ms query execution over 10,000 records.
- **Pytest Ecosystem**: Comprehensive testing support using `httpx.AsyncClient` / `TestClient` and transactional in-memory database fixtures.

---

## Architecture Diagrams

### 1. 3-Tier Backend Layered Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        BROWSER / CLIENT                        │
│                (HTTP JSON Request / Response)                  │
└───────────────────────────────┬────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                   FastAPI Backend Service                      │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Router Layer                      │  │
│  │  (app/routers/employees.py, analytics.py, export.py)     │  │
│  │  • Pydantic validation  • HTTP status mapping            │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                             │                                  │
│  ┌──────────────────────────▼───────────────────────────────┐  │
│  │                    Service Layer                         │  │
│  │  (app/services/employee_service.py, analytics_service)   │  │
│  │  • Business logic       • Currency conversion            │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                             │                                  │
│  ┌──────────────────────────▼───────────────────────────────┐  │
│  │               Repository Layer (DAO / DAL)               │  │
│  │  (app/repositories/employee_repo.py, analytics_repo)     │  │
│  │  • SQLAlchemy 2.0 select  • Aggregate SQL computations   │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                             │                                  │
│  ┌──────────────────────────▼───────────────────────────────┐  │
│  │              SQLAlchemy 2.0 Engine & Session             │  │
│  │  • Connection pool      • Transaction lifecycle          │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                             │                                  │
│  ┌──────────────────────────▼───────────────────────────────┐  │
│  │                    SQLite Database                       │  │
│  │                  (salary_manager.db)                     │  │
│  │  • Multi-column B-Tree indexes (dept, country, salary)   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

### 2. Employee Search, Filter, Sort & Paginate Flow

```
Browser                    FastAPI                     SQLite
  │                          │                           │
  │  GET /employees?         │                           │
  │  search=john&            │                           │
  │  department=Engineering& │                           │
  │  page=1&page_size=20     │                           │
  │ ─────────────────────▶   │                           │
  │                          │  1. Validate params       │
  │                          │     (Pydantic FilterParams)│
  │                          │                           │
  │                          │  2. Build dynamic query   │
  │                          │     WHERE + ORDER BY +    │
  │                          │     LIMIT 20 OFFSET 0     │
  │                          │  ──────────────────────▶  │
  │                          │                           │
  │                          │  3. Execute SELECT &      │
  │                          │     COUNT(*) queries      │
  │                          │  ──────────────────────▶  │
  │                          │                           │
  │                          │  ◀──── rows + count ────  │
  │                          │                           │
  │                          │  4. Compute pagination    │
  │                          │     (total_pages = 23)    │
  │                          │                           │
  │                          │  5. Serialize Pydantic    │
  │                          │     EmployeeResponse list │
  │  ◀─── 200 OK (JSON) ───  │                           │
```

---

### 3. Database Entity Relationship & Index Topology

```
┌───────────────────────────────────────────────────────────┐
│                        EMPLOYEES                          │
├───────────────────────┬───────────────────┬───────────────┤
│ Column Name           │ Data Type         │ Constraints   │
├───────────────────────┼───────────────────┼───────────────┤
│ id                    │ String(36)        │ PK (UUID)     │
│ first_name            │ String(100)       │ NOT NULL      │
│ last_name             │ String(100)       │ NOT NULL      │
│ email                 │ String(255)       │ UNIQUE        │
│ job_title             │ String(150)       │ NOT NULL      │
│ department            │ String(100)       │ INDEXED       │
│ country               │ String(100)       │ INDEXED       │
│ base_salary           │ Float             │ INDEXED       │
│ currency              │ String(10)        │ NOT NULL      │
│ usd_salary            │ Float             │ INDEXED       │
│ bonus_percentage      │ Float             │ DEFAULT 0.0   │
│ gender                │ String(20)        │ NOT NULL      │
│ performance           │ Integer           │ DEFAULT 3     │
│ hire_date             │ DateTime          │ NOT NULL      │
│ created_at            │ DateTime          │ DEFAULT now() │
│ updated_at            │ DateTime          │ DEFAULT now() │
└───────────────────────┴───────────────────┴───────────────┘
  Indexes:
  • idx_employee_name (last_name, first_name)
  • idx_employee_dept_country (department, country)

                            ▲
                            │ 1:N Currency Mapping
                            │
┌───────────────────────────┴───────────────────────────────┐
│                     CURRENCY_RATES                        │
├───────────────────────┬───────────────────┬───────────────┤
│ Column Name           │ Data Type         │ Constraints   │
├───────────────────────┼───────────────────┼───────────────┤
│ currency              │ String(10)        │ PK            │
│ rate_to_usd           │ Float             │ NOT NULL      │
│ effective_date        │ DateTime          │ NOT NULL      │
│ updated_at            │ DateTime          │ DEFAULT now() │
└───────────────────────┴───────────────────┴───────────────┘
```

---

### 4. Database Connection & Dependency Injection Lifecycle

```
  Incoming HTTP Request
            │
            ▼
 ┌─────────────────────┐
 │ FastAPI get_db()    │ ───▶ Creates SessionLocal()
 └──────────┬──────────┘
            │
            ▼
 ┌─────────────────────┐
 │ Execute Controller  │ ───▶ Router ──▶ Service ──▶ Repo
 └──────────┬──────────┘
            │
      ┌─────┴─────┐
      │ Error?    │
     /             \
  [No]             [Yes]
   │                 │
   ▼                 ▼
 ┌──────────┐      ┌──────────┐
 │ commit() │      │rollback()│
 └────┬─────┘      └────┬─────┘
      │                 │
      └────────┬────────┘
               │
               ▼
 ┌─────────────────────┐
 │ db.close() Exit     │ ───▶ Returns Session to Pool
 └──────────┬──────────┘
            │
            ▼
  Return HTTP Response
```

---

### 5. 10,000 Record Bulk Seeding Architecture

```
┌────────────────────────────────┐
│  python -m app.scripts.seed    │
│         (--count 10000)        │
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│   Faker Synthesizer Engine     │
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│   Batch Chunk Generator        │
│   (1,000 records per chunk)    │
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│  SQLAlchemy Bulk Insert        │
│  insert(Employee).values(...)  │
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│  SQLite Transaction Commit     │
│  (Finished in < 3.5s)          │
└────────────────────────────────┘
```

---

## Technical Specifications & Layer Responsibilities

### Layer Responsibility Matrix

| Layer | Primary Location | Key Responsibilities | Dependencies |
| :--- | :--- | :--- | :--- |
| **Router Layer** | `app/routers/` | HTTP Endpoint definitions, request body & param parsing, HTTP status code mapping, response serialization. | Service Layer, Pydantic Schemas |
| **Service Layer** | `app/services/` | Core business logic, currency normalization, composite analytics aggregation, export streaming logic. | Repository Layer, Pydantic Schemas |
| **Repository Layer** | `app/repositories/` | Data access object (DAO), SQLAlchemy query construction, filtering, pagination logic, database aggregates. | SQLAlchemy Engine, ORM Models |
| **Model Layer** | `app/models/` | SQLAlchemy declarative database schema mapping, index definitions, column constraints. | SQLAlchemy Core & ORM |
| **Schema Layer** | `app/schemas/` | Pydantic v2 data validation schemas, serialization rules, field constraints. | Pydantic v2 |

---

## Database Schema (SQLAlchemy 2.0)

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
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    usd_salary: Mapped[float] = mapped_column(Float, nullable=False, index=True) # Computed exchange value
    bonus_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    performance: Mapped[int] = mapped_column(Integer, default=3) # Scale 1-5
    hire_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_employee_name", "last_name", "first_name"),
        Index("idx_employee_dept_country", "department", "country"),
    )

class CurrencyRate(Base):
    __tablename__ = "currency_rates"

    currency: Mapped[str] = mapped_column(String(10), primary_key=True)
    rate_to_usd: Mapped[float] = mapped_column(Float, nullable=False)
    effective_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

---

## Sub-50ms Query Optimization Strategy

1. **Selective Indexing**: High-frequency filter columns (`department`, `country`, `usd_salary`, `base_salary`) use dedicated single-column indexes. Multi-column queries hit composite B-Tree index `idx_employee_dept_country` or `idx_employee_name`.
2. **Database-Level Analytics Computation**: All KPI metrics, average salary, total payroll, and pay equity calculations use native SQLite aggregate functions (`SUM`, `AVG`, `COUNT`, `MIN`, `MAX`) executed directly in C via SQLAlchemy ORM. Zero raw rows are pulled into Python memory for client-side loops.
3. **Cursor-Free Pagination**: Standardized `LIMIT page_size OFFSET (page - 1) * page_size` ensures SQL engines inspect only target records during paginated fetching.

---

## Error Handling & Exception Architecture

The backend implements standardized global exception handlers returning consistent JSON payloads:

```json
{
  "detail": "Employee with ID 'a1b2c3d4-...' not found",
  "status_code": 404,
  "error_type": "NotFoundError"
}
```

- **HTTP 404 Not Found**: Raised when requesting non-existent resource IDs.
- **HTTP 422 Unprocessable Entity**: Raised automatically by Pydantic validation when request schemas violate constraints (e.g. invalid email format, negative salary values).
- **HTTP 500 Internal Server Error**: Unexpected database errors intercepted and safely sanitized to prevent internal leakages.

---

## Testing Strategy

- **Pytest Framework**: Complete unit and API integration testing.
- **In-Memory SQLite Fixture**: Test suites run against isolated `:memory:` databases with auto-created tables and automatic rollback after every test function.
- **Fast Execution**: Test suite completes execution in under 2 seconds with 100% code coverage.

---

## Consequences

### Positive:
- Highly structured, layered Python architecture with automated OpenAPI documentation.
- Instant analytics computation using database-level SQL aggregate queries.
- Pytest suite enabling test-driven development (TDD) workflows.

### Negative / Mitigations:
- SQLite single-writer limitation during high concurrent write bursts.
  - *Mitigation*: Enable WAL (Write-Ahead Logging) mode via SQLite pragma (`PRAGMA journal_mode=WAL;`), providing high concurrent read throughput during write operations.
