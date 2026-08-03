# ADR 0004: Testing & Quality Assurance Strategy

## Status
Accepted

## Context
The ACME Salary Manager system handles sensitive payroll data for 10,000 employees. To maintain software reliability, prevent regressions, and guarantee sub-50ms performance SLAs, the system requires a rigorous, automated testing and quality assurance architecture. The strategy must enforce:
- **Zero Untested Code Policy**: 100% test coverage across all backend Python modules (`pytest --cov-fail-under=100`) and frontend TypeScript components.
- **Test-Driven Development (TDD)**: Writing failing unit and integration tests before feature implementation.
- **Sub-2-Second Execution Time**: Fast test suites allowing rapid developer feedback loops without long waiting times.
- **Automated Quality Gates**: Pre-commit git hooks that block commits if any test fails, coverage drops below 100%, or linters report violations.

## Decision Drivers
1. **System Reliability**: Zero unhandled exceptions or broken REST endpoints in production.
2. **Speed & Developer Velocity**: Test suite must run in < 2 seconds so developers can execute tests on every save.
3. **Data Isolation**: Tests must never mutate development or production SQLite databases (`salary_manager.db`).
4. **Deterministic Auditing**: Continuous enforcement of code style, type safety, and coverage criteria.

## Considered Options
1. **Pytest (Backend) + Vitest / React Testing Library (Frontend) + 100% Coverage Gate + Git Hooks** *(Selected)*
2. **Pytest + Cypress End-to-End Testing Only**
3. **Manual Verification & Ad-hoc Testing**

---

## Decision: Pytest + Vitest + 100% Coverage Gate + Pre-Commit Automation

We select **Pytest** for backend testing, **Vitest** with **React Testing Library** for frontend testing, **100% code coverage enforcement**, and **automated git pre-commit hooks**.

### Rationale:
- **Pytest Ecosystem**: Industry-standard Python test framework providing fixtures (`conftest.py`), parameterization, and seamless integration with `pytest-cov` and `httpx.AsyncClient`.
- **In-Memory SQLite Fixtures**: Backend tests run against an isolated SQLite `:memory:` database created per test function, providing zero disk write overhead and sub-second test execution.
- **Vitest & React Testing Library**: Fast ESM-native test runner for React components. Tests component behavior from a user perspective without relying on implementation details.
- **Pre-Commit Enforcement**: Git hooks execute `pytest`, `pylint`, `vitest`, and `eslint` automatically prior to every commit, preventing defective code from entering the repository.

---

## Architecture Diagrams

### 1. Automated Pre-Commit Verification Pipeline

```
  Developer Executes: git commit -m "..."
                    │
                    ▼
┌────────────────────────────────────────────────────────┐
│               Git Pre-Commit Hook Gate                 │
│               (.git/hooks/pre-commit)                  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 1. Backend Pytest Suite & Coverage Verification        │
│    pytest --cov=app --cov-fail-under=100               │
└──────────────────────────┬─────────────────────────────┘
                           │
                 [Pass: 100% Coverage]
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. Backend Pylint Static Analysis                      │
│    pylint app/ (Target: 10.00 / 10.00 score)           │
└──────────────────────────┬─────────────────────────────┘
                           │
                   [Pass: 0 Errors]
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. Frontend Vitest Component Suite                     │
│    vitest run (Target: 100% Passed)                    │
└──────────────────────────┬─────────────────────────────┘
                           │
                    [Pass: All Green]
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 4. Frontend ESLint Verification                        │
│    npm run lint (Target: 0 Errors)                     │
└──────────────────────────┬─────────────────────────────┘
                           │
                   [Pass: Clean Lint]
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│           Commit Accepted & Recorded in Git            │
└────────────────────────────────────────────────────────┘
```

---

### 2. Pytest In-Memory Database Session Lifecycle

```
Test Execution Trigger
          │
          ▼
┌──────────────────────────────────┐
│ conftest.py: db_engine Fixture   │ ──▶ Create sqlite:///:memory: Engine
└─────────┬────────────────────────┘
          │
          ▼
┌──────────────────────────────────┐
│ Base.metadata.create_all(engine) │ ──▶ Instantiate All Tables in Memory
└─────────┬────────────────────────┘
          │
          ▼
┌──────────────────────────────────┐
│ db_session Fixture               │ ──▶ Open Isolated Session
└─────────┬────────────────────────┘
          │
          ▼
┌──────────────────────────────────┐
│ Execute Test Function            │ ──▶ Seed test rows & invoke API / Repo
└─────────┬────────────────────────┘
          │
          ▼
┌──────────────────────────────────┐
│ Teardown & Rollback              │ ──▶ Session Close & Drop All Tables
└──────────────────────────────────┘
```

---

## Technical Specifications & Configuration

### 1. Backend Testing Specifications (`salary-manager-be`)

- **Location**: `salary-manager-be/tests/`
- **Runner Command**: `make test-be` or `pytest --cov=app --cov-fail-under=100`
- **Test Structure**:
  - `tests/db/`: Tests for database connection pool and model mappings.
  - `tests/repositories/`: Unit tests for `EmployeeRepository`, `AnalyticsRepository`, and `CurrencyRepository`.
  - `tests/services/`: Unit tests for `EmployeeService`, `AnalyticsService`, and `CurrencyService`.
  - `tests/routers/`: API integration tests using `httpx.AsyncClient` covering all HTTP status codes (`200`, `201`, `404`, `422`).
  - `tests/scripts/`: Tests for database seeding script.

### 2. Frontend Testing Specifications (`salary-manager-fe`)

- **Location**: `salary-manager-fe/src/` (`*.test.tsx`, `*.test.ts`)
- **Runner Command**: `make test-fe` or `npm test`
- **Test Coverage**:
  - Services testing: `employeeService.test.ts`, `analyticsService.test.ts`, `metaService.test.ts`, `exportService.test.ts`.
  - Component testing: `KPICards.test.tsx`, `AnalyticsCharts.test.tsx`, `EmployeeTable.test.tsx`, `FilterToolbar.test.tsx`, `EmployeeModal.test.tsx`, `DeleteConfirmModal.test.tsx`, `Navbar.test.tsx`.

---

## Consequences

### Positive:
- **Zero Regression Risk**: 100% test coverage guarantees every branch, edge case, and error handler is continuously verified.
- **Instant Developer Feedback**: Entire backend test suite runs in ~0.5 seconds; frontend suite runs in ~1.7 seconds.
- **Automated Quality Control**: Broken code cannot be committed to Git due to pre-commit hook enforcement.

### Negative / Mitigations:
- High initial development overhead when writing tests before feature implementation.
  - *Mitigation*: Strictly follow the TDD workflow enforced by the `test-writer-agent` and `code-writer-agent`.
