# ACME Salary Manager

A high-performance web-based Employee Salary Management system for ACME Org to manage 10,000 employees across global offices, providing real-time compensation analytics, paginated data grid operations, multi-currency normalization, and streaming CSV export.

## Tech Stack

- **Backend**: Python 3.14+, FastAPI, SQLAlchemy 2.0 ORM, Pydantic v2, SQLite (WAL mode)
- **Frontend**: Next.js (React 19), Tailwind CSS, Recharts, TanStack Query v5

---

## Project Structure

- `salary-manager-be/`: FastAPI backend service (3-layer architecture: Routers → Services → Repositories)
- `salary-manager-fe/`: Next.js frontend application
- `docs/`: Product requirements (`REQUIREMENTS.md`) and Architecture Decision Records (`docs/adr/`)

---

## Quick Start

### 1. Install Dependencies & Setup Hooks
```bash
make install
```

### 2. Seed 10,000 Employees (< 5 Seconds SLA)
```bash
make seed
```

### 3. Start Backend Server
```bash
make dev-be
```
- API Endpoint: `http://localhost:8000/api/v1`
- Swagger OpenAPI Specs: `http://localhost:8000/docs`

---

## API Surface (13 Endpoints)

| Group | Method & Endpoint | Description |
| :--- | :--- | :--- |
| **Employees CRUD** | `GET /api/v1/employees` | Server-side paginated list with sorting, multi-column search, & filters |
| | `POST /api/v1/employees` | Create employee record (auto-computes `usd_salary`, checks email uniqueness) |
| | `GET /api/v1/employees/{id}` | Fetch single employee details by ID |
| | `PUT /api/v1/employees/{id}` | Update employee details (recalculates `usd_salary` on salary/currency change) |
| | `DELETE /api/v1/employees/{id}` | Delete employee record |
| **Analytics** | `GET /api/v1/analytics/summary` | Executive KPIs (Total Payroll, Average, Median, Min, Max, Headcount) |
| | `GET /api/v1/analytics/by-department` | Departmental headcount & spend distribution |
| | `GET /api/v1/analytics/by-country` | Country headcount & payroll distribution % |
| | `GET /api/v1/analytics/by-gender` | Gender pay parity metrics & average salaries |
| **Export** | `GET /api/v1/export/csv` | Stream filtered dataset as downloadable CSV attachment |
| **Metadata** | `GET /api/v1/meta/departments` | Unique department list for dropdown options |
| | `GET /api/v1/meta/countries` | Unique country list for dropdown options |
| | `GET /api/v1/meta/salary-range` | Global min and max `usd_salary` bounds for slider |

---

## Running Verification

### Run Backend Pytest Suite
```bash
make test-be
```

### Run Backend Pylint (10.00/10 Rating)
```bash
make lint-be
```

---

## Documentation

- [Requirements Document](docs/REQUIREMENTS.md)
- [ADR 0001: Backend Architecture](docs/adr/0001-backend-architecture.md)
- [ADR 0002: Frontend Architecture](docs/adr/0002-frontend-architecture.md)
- [ADR 0003: System Architecture Deep Dive](docs/adr/0003-system-architecture.md)
