# Salary Manager

A web-based Employee Salary Management system for ACME Org to manage 10,000 employees across global offices, providing real-time compensation analytics, paginated data grid operations, and multi-currency tracking.

## Tech Stack

- **Backend**: Python 3.14+, FastAPI, SQLAlchemy 2.0, Pydantic v2, SQLite
- **Frontend**: Next.js (React 19), Tailwind CSS, Recharts, TanStack Query v5

## Project Structure

- `salary-manager-be/`: FastAPI backend service
- `salary-manager-fe/`: Next.js frontend application
- `docs/`: Product requirements and Architecture Decision Records (ADRs)

## Quick Start

### Backend

```bash
cd salary-manager-be
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python scripts/seed.py
uvicorn app.main:app --reload
```

### Frontend

```bash
cd salary-manager-fe
npm install
npm run dev
```

## Running Tests

### Backend

```bash
cd salary-manager-be
source .venv/bin/activate
pytest
```

### Frontend

```bash
cd salary-manager-fe
npm test
```

## Documentation

- [Requirements Document](docs/REQUIREMENTS.md)
- [ADR 0001: Backend Architecture](docs/adr/0001-backend-architecture.md)
- [ADR 0002: Frontend Architecture](docs/adr/0002-frontend-architecture.md)
- [ADR 0003: System Architecture Deep Dive](docs/adr/0003-system-architecture.md)
