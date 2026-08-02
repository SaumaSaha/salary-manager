# AI Collaboration Log 1: Architecture, Tooling & Initial Setup

## Overview

This document highlights the human-in-the-loop engineering process and critical architectural decisions made during the setup of the **ACME Salary Manager**. Rather than blindly accepting AI-generated defaults or code snippets, the engineering lead actively questioned, challenged, and refined the architecture to ensure real-world correctness, performance, maintainability, and clean software craftsmanship.

---

## Key Architectural Decisions & Engineering Pivots

### 1. Seeding Strategy: Migration vs. Standalone Script

- **AI Initial Proposal**: Move the 10,000 employee seed logic into an Alembic database migration (`002_seed_employees.py`).
- **Human Evaluation & Challenge**: Asked *"Will it be better to do with migration or through script?"* Analyzed the fundamental difference between schema evolution and test data generation:
  - Migrations belong in production and must be deterministic.
  - `faker` generates random test data and introduces non-deterministic outputs into migration chains.
  - Seeding in migrations forces `faker` into production dependencies.
- **Final Decision**: Kept seeding as an **idempotent standalone script** (`scripts/seed.py`) with `--count` and `--reset` options, keeping schema migrations lean and production-ready.

---

### 2. Multi-Currency Architecture: Hardcoded Dict vs. DB-Backed Table

- **AI Initial Proposal**: Hardcode static FX exchange rates in a Python dictionary (`EXCHANGE_RATES = {"EUR": 1.08, ...}`).
- **Human Evaluation & Challenge**: Raised real-world organizational context: *"In most companies the static exchange rate table is updated twice a year and is mostly stored in DB. Are we storing the data in DB?"*
- **Final Decision**:
  - Modeled a `currency_rates` database table (`currency`, `rate_to_usd`, `effective_date`, `updated_at`).
  - Pre-populated rates via the seed script and cached them in-memory at app startup for zero-latency conversion.
  - Deliberately scoped out an Admin UI for rate management in V1, allowing SQL updates while keeping the UI lean.

---

### 3. Data Fetching Stack: SWR vs. TanStack Query v5

- **AI Initial Proposal**: Use SWR for client-side data fetching.
- **Human Evaluation & Choice**: Evaluated options and instructed: *"Let's do TanStack Query"*.
- **Final Decision**: Selected **TanStack Query v5 (React Query)** to leverage explicit query key structures (`['employees', filters]`), structured query invalidation on mutations (`useMutation`), and Query Devtools.

---

### 4. Compensation Analytics: Why Include Median Salary?

- **Human Evaluation & Challenge**: Questioned *"Why will an HR require a Median Salary?"*
- **Engineering Reasoning**: Analyzed the mathematical difference between Average and Median in compensation:
  - Average salary is heavily skewed by C-suite outlier salaries.
  - Median represents the true midpoint (50th percentile), critical for realistic compensation benchmarking, budget planning, and gender pay equity audits.
- **Final Decision**: Retained Median Salary alongside Average Salary, implementing an indexed SQL `ORDER BY ... LIMIT 1 OFFSET n/2` query executing in under 2ms.

---

### 5. Server-Side vs. Client-Side Sorting & Pagination

- **Human Evaluation & Challenge**: Questioned *"Why the sort is not performed in client-side?"*
- **Engineering Reasoning**: Identified that client-side sorting over a paginated dataset only sorts the 20 visible rows, leaving out the actual top earners across the 10,000 total records.
- **Final Decision**: Enforced **server-side sorting and pagination** (`ORDER BY usd_salary DESC LIMIT 20 OFFSET 0`), ensuring users see true global max/min values while maintaining sub-50ms API response times.

---

### 6. Repository Hygiene, Tooling, & Test Architecture

Throughout the build process, the developer strictly controlled code organization and developer ergonomics:

| Area | Human Directive / Pivot | Engineering Rationale |
| :--- | :--- | :--- |
| **Requirements Cleanliness** | *"don't put versions in the requirements.txt"* | Keeps requirements flexible while lock files manage exact resolutions. |
| **Test Organization** | *"tests should follow the same structure as app"* | Mirrored `app/routers/health.py` to `tests/routers/test_health.py` for clarity. |
| **Test Colocation** | *"colocate the test don't need \_\_tests\_\_"* | Colocated `src/app/page.test.tsx` next to `page.tsx` instead of creating nested `__tests__` folders. |
| **Linter Scope** | *"pylint should only run on the app folder"* | Focused pylint strictly on core application code (`pylint app`) with `PYTHONPATH=.`. |
| **Clean Output & Git Hooks** | *"Put Colors in the pre-commit no need of symbols"* | Replaced emojis with clean ANSI terminal colors (cyan/red/green) in `.githooks/pre-commit`. |
| **Unnecessary Artifact Cleanup** | *"delete CLAUDE.md, AGENTS.md, unneeded default SVGs"* | Purged auto-generated CLI clutter to keep repository lean. |

---

## Summary

This log documents **AI-assisted software engineering**: AI was used to accelerate boilerplate creation, script execution, and draft code, while the human developer maintained strict control over architectural boundaries, domain accuracy, performance constraints, and repository cleanliness.
