# ADR 0003: System Architecture Deep Dive

## Status
Accepted

## Overview

This document details the end-to-end system architecture for the ACME Salary Manager — covering the backend layered architecture, API contract design, data flow patterns, frontend component hierarchy, and cross-cutting concerns.

---

## 1. High-Level System Topology

```
┌────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               Next.js React Application                 │   │
│  │  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌─────────┐  │   │
│  │  │ KPI Grid│  │ Charts   │  │ DataTable │  │ Modals  │  │   │
│  │  └────┬────┘  └────┬─────┘  └─────┬─────┘  └────┬────┘  │   │
│  │       └─────────────┴──────────────┴─────────────┘      │   │
│  │                    TanStack Query Cache Layer           │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │ HTTP (JSON)                      │
└─────────────────────────────┼──────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   FastAPI Backend (Python)                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                    API Router Layer                      │    │
│  │  /api/v1/employees    /api/v1/analytics   /api/v1/export │    │
│  └──────────────────────────┬───────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────────────────▼───────────────────────────────┐    │
│  │                    Service Layer                         │    │
│  │  EmployeeService       AnalyticsService    ExportService │    │
│  └──────────────────────────┬───────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────────────────▼───────────────────────────────┐    │
│  │                  Repository Layer (DAL)                  │    │
│  │  EmployeeRepository                  AnalyticsRepository │    │
│  └──────────────────────────┬───────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────────────────▼───────────────────────────────┐    │
│  │              SQLAlchemy 2.0 ORM + Session                │    │
│  └──────────────────────────┬───────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────────────────▼───────────────────────────────┐    │
│  │                    SQLite Database                       │    │
│  │                  (salary_manager.db)                     │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Backend Layered Architecture

### Layer Responsibilities

| Layer | Responsibility | Example |
| :--- | :--- | :--- |
| **Router** | HTTP request parsing, Pydantic validation, status codes, response serialization | `GET /api/v1/employees?page=2&department=Engineering` |
| **Service** | Business logic orchestration, currency conversion, composite analytics computation | Calculating median salary across filtered dataset |
| **Repository** | Pure database access — SQLAlchemy queries, pagination cursors, aggregate SQL | `SELECT AVG(usd_salary) FROM employees WHERE department = ?` |
| **Model** | SQLAlchemy ORM entity definitions and table mappings | `Employee` model with typed columns |
| **Schema** | Pydantic v2 request/response models for validation and serialization | `EmployeeCreate`, `EmployeeResponse`, `PaginatedResponse` |

### Why Three Layers (Not Two)?

Putting query logic directly in routers is a common FastAPI anti-pattern. Separating Repository from Service enables:
1. **Testability**: Repository functions can be unit-tested with an in-memory SQLite DB without spinning up HTTP.
2. **Reusability**: The `AnalyticsService` can compose multiple repository calls (e.g., department breakdown + gender stats) into a single response.
3. **Swap-ability**: Replacing SQLite with PostgreSQL only touches the Repository and connection config — zero service or router changes.

---

## 3. Backend Directory Structure

```
salary-manager-be/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app factory, CORS, lifespan
│   ├── config.py                  # Settings (DB path, page sizes, currencies)
│   ├── database.py                # Engine, SessionLocal, get_db dependency
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   └── employee.py            # SQLAlchemy Employee model
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── employee.py            # Pydantic: EmployeeCreate, EmployeeUpdate, EmployeeResponse
│   │   ├── analytics.py           # Pydantic: KPISummary, DeptBreakdown, CountryBreakdown
│   │   └── common.py              # Pydantic: PaginatedResponse, FilterParams, SortParams
│   │
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── employee_repo.py       # CRUD queries, paginated list, search
│   │   └── analytics_repo.py      # Aggregate SQL: AVG, SUM, COUNT, GROUP BY
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── employee_service.py    # Business logic: validation, currency conversion on create
│   │   ├── analytics_service.py   # Compose KPI cards, department/country/gender breakdowns
│   │   └── export_service.py      # CSV stream generation from filtered queries
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── employees.py           # /api/v1/employees CRUD endpoints
│   │   ├── analytics.py           # /api/v1/analytics endpoints
│   │   └── export.py              # /api/v1/export/csv endpoint
│   │
│   └── utils/
│       ├── __init__.py
│       └── currency.py            # Static exchange rate map + conversion helpers
│
├── scripts/
│   └── seed.py                    # 10,000 employee seeder (faker, idempotent, --count flag)
│
├── tests/
│   ├── conftest.py                # Pytest fixtures: in-memory DB, test client
│   ├── test_employee_repo.py
│   ├── test_analytics_repo.py
│   ├── test_employee_api.py
│   └── test_analytics_api.py
│
├── requirements.txt
├── pyproject.toml
└── README.md
```

---

## 4. API Contract Design

### 4.1 Employees CRUD

| Method | Endpoint | Purpose | Key Query Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/employees` | Paginated list with search, filter, sort | `page`, `page_size`, `search`, `department`, `country`, `min_salary`, `max_salary`, `sort_by`, `sort_order` |
| `GET` | `/api/v1/employees/{id}` | Single employee detail | — |
| `POST` | `/api/v1/employees` | Create employee | JSON body: `EmployeeCreate` |
| `PUT` | `/api/v1/employees/{id}` | Full update | JSON body: `EmployeeUpdate` |
| `DELETE` | `/api/v1/employees/{id}` | Delete employee | — |

#### Paginated List Response Shape

```json
{
  "data": [
    {
      "id": "a1b2c3d4-...",
      "first_name": "Priya",
      "last_name": "Sharma",
      "email": "priya.sharma@acme.com",
      "job_title": "Senior Engineer",
      "department": "Engineering",
      "country": "India",
      "base_salary": 2800000.00,
      "currency": "INR",
      "usd_salary": 33600.00,
      "bonus_percentage": 12.5,
      "gender": "Female",
      "performance": 4,
      "hire_date": "2021-03-15T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_records": 10000,
    "total_pages": 500
  }
}
```

### 4.2 Analytics

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/v1/analytics/summary` | Executive KPI cards (total payroll, avg, median, headcount, min/max) |
| `GET` | `/api/v1/analytics/by-department` | Department-level salary aggregates |
| `GET` | `/api/v1/analytics/by-country` | Country-level salary aggregates |
| `GET` | `/api/v1/analytics/by-gender` | Gender pay parity metrics |

#### KPI Summary Response Shape

```json
{
  "total_payroll_usd": 485000000.00,
  "average_salary_usd": 48500.00,
  "median_salary_usd": 45200.00,
  "employee_count": 10000,
  "highest_salary_usd": 350000.00,
  "lowest_salary_usd": 18000.00,
  "departments_count": 8,
  "countries_count": 12
}
```

#### Department Breakdown Response Shape

```json
{
  "departments": [
    {
      "department": "Engineering",
      "employee_count": 2500,
      "total_payroll_usd": 162500000.00,
      "average_salary_usd": 65000.00,
      "median_salary_usd": 60000.00
    }
  ]
}
```

### 4.3 Export

| Method | Endpoint | Purpose | Query Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/export/csv` | Stream CSV of filtered employees | Same filters as employee list |

Returns `Content-Type: text/csv` with `Content-Disposition: attachment` header.

### 4.4 Metadata / Filters

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/v1/meta/departments` | List of unique department names (for filter dropdowns) |
| `GET` | `/api/v1/meta/countries` | List of unique country names (for filter dropdowns) |
| `GET` | `/api/v1/meta/salary-range` | Min/max salary bounds (for range slider) |

---

## 5. Data Flow Patterns

### 5.1 Employee List — Search + Filter + Sort + Paginate

```
Browser                    FastAPI                     SQLite
  │                          │                           │
  │  GET /employees?         │                           │
  │  search=sharma&          │                           │
  │  department=Engineering& │                           │
  │  sort_by=usd_salary&     │                           │
  │  sort_order=desc&        │                           │
  │  page=2&page_size=20     │                           │
  │ ─────────────────────▶   │                           │
  │                          │  1. Validate params       │
  │                          │     (Pydantic)            │
  │                          │                           │
  │                          │  2. Build dynamic query   │
  │                          │     with WHERE + ORDER BY │
  │                          │     + LIMIT/OFFSET        │
  │                          │  ──────────────────────▶  │
  │                          │                           │
  │                          │  3. Execute COUNT(*)      │
  │                          │     for total_records     │
  │                          │  ──────────────────────▶  │
  │                          │                           │
  │                          │  ◀──── rows + count ────  │
  │                          │                           │
  │                          │  4. Serialize via Pydantic│
  │  ◀─── JSON response ──   │                           │
```

### 5.2 Analytics — KPI Summary Computation

```
Browser                    FastAPI                     SQLite
  │                          │                           │
  │  GET /analytics/summary  │                           │
  │ ─────────────────────▶   │                           │
  │                          │  Single query:            │
  │                          │  SELECT                   │
  │                          │    COUNT(*),              │
  │                          │    SUM(usd_salary),       │
  │                          │    AVG(usd_salary),       │
  │                          │    MIN(usd_salary),       │
  │                          │    MAX(usd_salary),       │
  │                          │    COUNT(DISTINCT dept),  │
  │                          │    COUNT(DISTINCT country)│
  │                          │  FROM employees           │
  │                          │  ──────────────────────▶  │
  │                          │                           │
  │                          │  Median: separate query   │
  │                          │  ORDER BY usd_salary      │
  │                          │  LIMIT 1 OFFSET n/2       │
  │                          │  ──────────────────────▶  │
  │                          │                           │
  │  ◀─── KPI JSON ───────   │                           │
```

> **Design Note — Median Calculation**: SQLite does not have a native `MEDIAN()` function. We compute it by ordering and offsetting to the middle row(s). For 10,000 records this is instantaneous (<2ms with the `usd_salary` index).

### 5.3 CRUD — Create Employee with Currency Conversion

```
Browser                    FastAPI                     SQLite
  │                          │                           │
  │  POST /employees         │                           │
  │  { base_salary: 2800000, │                           │
  │    currency: "INR", ... }│                           │
  │ ─────────────────────▶   │                           │
  │                          │  1. Pydantic validates    │
  │                          │     all fields            │
  │                          │                           │
  │                          │  2. Service converts:     │
  │                          │     usd_salary =          │
  │                          │     2800000 * cache["INR"]│
  │                          │     = $33,600             │
  │                          │                           │
  │                          │  3. Generate UUID         │
  │                          │                           │
  │                          │  4. INSERT                │
  │                          │  ──────────────────────▶  │
  │                          │                           │
  │  ◀─── 201 + employee ─   │                           │
```

---

## 6. Currency Conversion Strategy

Exchange rates are stored in a **`currency_rates` database table**, pre-populated by the seed script. Rates are cached in-memory on app startup for fast lookups.

```python
# app/models/currency_rate.py

class CurrencyRate(Base):
    __tablename__ = "currency_rates"

    currency: Mapped[str] = mapped_column(String(10), primary_key=True)   # EUR, GBP, INR...
    rate_to_usd: Mapped[float] = mapped_column(Float, nullable=False)     # 1 EUR = 1.08 USD
    effective_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

```python
# app/utils/currency.py

_rates_cache: dict[str, float] = {}

def load_rates(db: Session) -> None:
    """Load rates from DB into memory. Called on app startup."""
    global _rates_cache
    rates = db.query(CurrencyRate).all()
    _rates_cache = {r.currency: r.rate_to_usd for r in rates}

def to_usd(amount: float, currency: str) -> float:
    rate = _rates_cache.get(currency.upper())
    if rate is None:
        raise ValueError(f"Unsupported currency: {currency}")
    return round(amount * rate, 2)
```

**Why DB-backed, not hardcoded?**
- In most organizations, exchange rates are updated semi-annually (H1/H2) and stored in the system of record.
- DB storage allows rate updates via direct SQL without code changes or redeployment.
- An admin endpoint for rate management is deferred to V2 — V1 uses direct DB updates.
- Rates are cached in-memory at startup, so there's zero query overhead per conversion.

---

## 7. Frontend Architecture

### 7.1 Page & Component Hierarchy

```
App (Next.js)
├── Layout
│   ├── Header
│   │   ├── Logo + App Title
│   │   ├── GlobalSearch (triggers table filter)
│   │   ├── ExportCSVButton
│   │   └── ThemeToggle (dark/light)
│   │
│   └── Main Content
│       ├── KPIMetricGrid                          ← GET /analytics/summary
│       │   ├── MetricCard (Total Payroll)
│       │   ├── MetricCard (Avg Salary)
│       │   ├── MetricCard (Median Salary)
│       │   ├── MetricCard (Employee Count)
│       │   ├── MetricCard (Highest Salary)
│       │   └── MetricCard (Lowest Salary)
│       │
│       ├── AnalyticsChartsSection
│       │   ├── DepartmentBarChart               ← GET /analytics/by-department
│       │   ├── CountryDonutChart                ← GET /analytics/by-country
│       │   └── GenderPayParityChart             ← GET /analytics/by-gender
│       │
│       └── EmployeeDataSection
│           ├── FilterBar
│           │   ├── DepartmentDropdown           ← GET /meta/departments
│           │   ├── CountryDropdown              ← GET /meta/countries
│           │   ├── SalaryRangeSlider            ← GET /meta/salary-range
│           │   └── ClearFiltersButton
│           │
│           ├── EmployeeTable                    ← GET /employees?...
│           │   ├── SortableColumnHeaders
│           │   ├── EmployeeRows
│           │   └── PaginationControls
│           │
│           ├── AddEmployeeModal                 ← POST /employees
│           └── EditEmployeeModal                ← PUT /employees/{id}
```

### 7.2 Data Fetching Strategy (TanStack Query v5)

| Hook / Query | Endpoint | Query Key | Revalidation / Invalidation Trigger |
| :--- | :--- | :--- | :--- |
| `useEmployees(filters)` | `GET /api/v1/employees?...` | `['employees', filters]` | Filter change, page change, sort change, `queryClient.invalidateQueries` |
| `useAnalyticsSummary()` | `GET /api/v1/analytics/summary` | `['analytics', 'summary']` | On mount + after any employee mutation |
| `useDepartmentBreakdown()` | `GET /api/v1/analytics/by-department` | `['analytics', 'department']` | On mount + after mutation |
| `useCountryBreakdown()` | `GET /api/v1/analytics/by-country` | `['analytics', 'country']` | On mount + after mutation |
| `useGenderStats()` | `GET /api/v1/analytics/by-gender` | `['analytics', 'gender']` | On mount + after mutation |
| `useDepartments()` | `GET /api/v1/meta/departments` | `['meta', 'departments']` | On mount (staleTime: Infinity) |
| `useCountries()` | `GET /api/v1/meta/countries` | `['meta', 'countries']` | On mount (staleTime: Infinity) |
| `useSalaryRange()` | `GET /api/v1/meta/salary-range` | `['meta', 'salary-range']` | On mount (staleTime: Infinity) |

**Mutation Flow**: After a successful `useMutation` execution (`POST`/`PUT`/`DELETE`), the `onSuccess` handler executes `queryClient.invalidateQueries({ queryKey: ['employees'] })` and `queryClient.invalidateQueries({ queryKey: ['analytics'] })` simultaneously, ensuring KPI cards, charts, and table rows reflect the latest state deterministically.

### 7.3 Frontend Directory Structure

```
salary-manager-fe/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, fonts, theme provider
│   │   ├── page.tsx                # Main dashboard page
│   │   └── globals.css             # Design tokens, base styles
│   │
│   ├── components/
│   │   ├── header/
│   │   │   └── Header.tsx
│   │   ├── kpi/
│   │   │   ├── KPIMetricGrid.tsx
│   │   │   └── MetricCard.tsx
│   │   ├── charts/
│   │   │   ├── DepartmentBarChart.tsx
│   │   │   ├── CountryDonutChart.tsx
│   │   │   └── GenderPayParityChart.tsx
│   │   ├── employees/
│   │   │   ├── FilterBar.tsx
│   │   │   ├── EmployeeTable.tsx
│   │   │   ├── PaginationControls.tsx
│   │   │   ├── AddEmployeeModal.tsx
│   │   │   └── EditEmployeeModal.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Modal.tsx
│   │       └── Slider.tsx
│   │
│   ├── hooks/
│   │   ├── useEmployees.ts
│   │   ├── useAnalytics.ts
│   │   └── useMeta.ts
│   │
│   ├── lib/
│   │   ├── api.ts                  # Axios/fetch wrapper, base URL config
│   │   ├── types.ts                # TypeScript interfaces mirroring Pydantic schemas
│   │   └── formatters.ts           # Currency formatting, number abbreviations
│   │
│   └── config/
│       └── constants.ts            # API base URL, page sizes, theme tokens
│
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 8. Cross-Cutting Concerns

### 8.1 CORS
FastAPI middleware configured to allow the Next.js dev server origin (`http://localhost:3000`).

### 8.2 Error Handling
- **Backend**: FastAPI exception handlers returning structured JSON errors:
  ```json
  { "detail": "Employee not found", "status_code": 404 }
  ```
- **Frontend**: TanStack Query `onError` callbacks and mutation `onError` handlers render toast notifications; form validation errors displayed inline.

### 8.3 Pagination Strategy
- **Offset-based** (`LIMIT` / `OFFSET`) is sufficient for 10,000 records. Cursor-based pagination adds complexity without measurable benefit at this scale.
- Page sizes: 20 (default), 50, 100.

### 8.4 Search Implementation
- **LIKE-based** search on `first_name`, `last_name`, `email`, and `job_title` using SQLAlchemy `or_()` and `ilike()`.
- The composite name index (`idx_employee_name`) accelerates name prefix searches.
- For 10,000 records, `LIKE '%term%'` on indexed columns executes in <5ms — FTS (Full-Text Search) is not required at this scale.

### 8.5 Seeding (`scripts/seed.py`)
- Standalone Python script, deliberately kept **outside** the Alembic migration chain — seed data is environment-specific test data, not a schema change.
- **Idempotent**: checks if records exist; supports `--reset` to clear and re-seed.
- **Configurable**: `--count` flag allows seeding fewer records for fast local testing (e.g., `python scripts/seed.py --count 100`).
- Uses `faker` with locale mixing (`en_US`, `en_GB`, `en_IN`, `ja_JP`, `fr_FR`, `en_CA`) to produce realistic multinational employee names.
- Departments: Engineering, Product, Sales, Marketing, Finance, HR, Operations, Legal.
- Countries: USA, UK, India, Japan, Germany, Canada, France, Australia, Singapore, Brazil, Nigeria, UAE.
- Salary ranges calibrated per country (e.g., India ₹400K–₹6M, USA $40K–$350K).
- Batch inserts of 1,000 records per chunk for optimal SQLite write performance.

---

## 9. Deployment & Local Dev Topology

```
Terminal 1 (Backend):
  cd salary-manager-be
  python -m venv .venv && source .venv/bin/activate
  pip install -r requirements.txt
  python scripts/seed.py           # Seeds 10,000 records (run once)
  uvicorn app.main:app --reload    # http://localhost:8000

Terminal 2 (Frontend):
  cd salary-manager-fe
  npm install
  npm run dev                      # http://localhost:3000
```

Frontend proxies API calls to `http://localhost:8000/api/v1/...` via Next.js `rewrites` or an environment variable (`NEXT_PUBLIC_API_URL`).
