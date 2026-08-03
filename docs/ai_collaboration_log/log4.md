# AI Collaboration Log 4: Frontend Implementation, Filter UX, TanStack Query & API Services Modularization

## Overview

This document records the human-guided architectural evolution, user experience (UX) refinements, state management modernization, and modular service decomposition during the **ACME Salary Manager** frontend development phase.

---

## Key Architectural Decisions & Engineering Pivots

### 1. 10-Phase Subagent Workflow for Frontend Implementation

- **Human Evaluation & Challenge**: Requested full frontend construction following the established subagent methodology: *"Let's Implement the Front End implementation should follow the agent workflow"*.
- **Engineering Design & Solution**:
  - Executed TDD workflow by writing component and service unit tests using Vitest and React Testing Library before final code binding.
  - Implemented Next.js TypeScript components under `salary-manager-fe/src/components/`:
    - `Navbar.tsx` — ACME branding header and CSV dataset export action
    - `KPICards.tsx` — Executive summary cards (total payroll, average/median/min/max salary, employee count)
    - `FilterToolbar.tsx` — Debounced search, dropdown filters, salary range bounds, and clear filters control
    - `EmployeeTable.tsx` — Dynamic column sorting, paginated grid, performance status badges, and CRUD action triggers
    - `AnalyticsCharts.tsx` — Visual breakdowns for department spend, country payroll distribution, and pay equity by gender
    - `EmployeeModal.tsx` & `DeleteConfirmModal.tsx` — Accessible form dialogs for employee creation, editing, and deletion

---

### 2. Standardized Single-Select Filter Dropdowns & Zero-Filter Initial State

- **Human Evaluation & Challenge**: Refined UX behavior: *"Filter is giving issues the department and country should be a drop down and on opening there shouldn't be any filters selected"*.
- **Engineering Design & Solution**:
  - Replaced multi-select input controls in `FilterToolbar.tsx` with clean HTML `<select>` single-choice dropdowns.
  - Configured default initial state to `"All Departments"` (`value=""`) and `"All Countries"` (`value=""`), ensuring no dataset filters are pre-selected on initial page load or reset.
  - Updated filter change handlers to convert selection to single-element arrays (`department: val ? [val] : []`) matching backend query specifications.

---

### 3. TanStack Query (v5) Modernization & Reactive Cache Invalidation

- **Human Evaluation & Challenge**: Evaluated state management architecture: *"Where are we using the TanStack Query?"*.
- **Engineering Design & Solution**:
  - Installed `@tanstack/react-query` and created a client provider wrapper in `salary-manager-fe/src/app/providers.tsx` mounted via `layout.tsx`.
  - Refactored `src/app/page.tsx` from manual `useEffect`/`useState` logic to reactive `useQuery` hooks for table data, KPI metrics, analytical breakdowns, and metadata.
  - Implemented `useMutation` for Create, Update, and Delete operations with automatic query cache invalidation (`queryClient.invalidateQueries()`). Ensures real-time UI synchronization across executive cards, charts, and employee grids in **< 1 second** (satisfying requirement **FR-ANALYTICS-05**).

---

### 4. Modular Separation of API Services

- **Human Evaluation & Challenge**: Directed code organization: *"seperate the services"*.
- **Engineering Design & Solution**:
  - Decomposed the monolithic `src/services/api.ts` into single-responsibility domain modules under `salary-manager-fe/src/services/`:
    - `client.ts` — Base HTTP client, `API_BASE` resolution, and `handleResponse<T>()` exception parser.
    - `employeeService.ts` — CRUD operations (`fetchEmployees`, `createEmployee`, `updateEmployee`, `deleteEmployee`).
    - `analyticsService.ts` — Analytical data fetchers (`fetchKPISummary`, `fetchDepartmentAnalytics`, `fetchCountryAnalytics`, `fetchGenderAnalytics`).
    - `metaService.ts` — Metadata lookup endpoints (`fetchDepartments`, `fetchCountries`, `fetchSalaryRange`).
    - `exportService.ts` — CSV dataset export URL generator (`getExportCsvUrl`).
    - `index.ts` & `api.ts` — Barrel re-exports ensuring 100% backward compatibility across component imports.
  - Created modular unit tests: `employeeService.test.ts`, `analyticsService.test.ts`, `metaService.test.ts`, and `exportService.test.ts`.

---

### 5. Backend Schema & Frontend Data Contract Normalization

- **Human Evaluation & Challenge**: Fixed runtime data binding issue: *"No employees are showing on the page load"*.
- **Engineering Design & Solution**:
  - Identified contract discrepancy where backend FastAPI endpoints return `{ "items": [...], "pagination": {...} }` while frontend expected `res.data`.
  - Added resilient fallback resolvers in `api.ts` and `analyticsService.ts`:
    - `items` vs `data` list normalization
    - `min_salary_usd` / `lowest_salary_usd` and `max_salary_usd` / `highest_salary_usd` mapping
    - `percentage_of_payroll` / `percentage_payroll` mapping
    - `employee_count` / `headcount` mapping
  - Updated `src/types/index.ts` interfaces to represent all valid API response fields safely.

---

## Summary Table of Frontend Architectural Improvements

| Feature / Domain | Before | After | Benefit |
| :--- | :--- | :--- | :--- |
| **Filter Controls** | Complex multi-select controls with pre-selected options. | Single-select `<select>` dropdowns defaulting to "All" (`""`). | Clean, intuitive UX; zero initial filters applied on open. |
| **Data Fetching** | Imperative `useEffect` + `useState` fetching loops. | Declarative `useQuery` hooks via TanStack Query v5. | Built-in caching, background revalidation, and cleaner state. |
| **Mutation Invalidation**| Manual refetch functions called after CRUD actions. | `useMutation` with `queryClient.invalidateQueries()`. | Guaranteed <1s sync across table and analytics charts. |
| **API Architecture** | Single 130-line monolithic `api.ts` file. | Modular `client.ts`, `employeeService`, `analyticsService`, `metaService`. | Separated concerns, maintainability, and domain isolation. |
| **Data Contract Safety** | Rigid expectation of `data` property. | Defensive fallback normalization (`items` || `data`, `lowest` || `min`). | Zero runtime exceptions; resilient backend schema alignment. |

---

## Verification & Quality Assurance

- **Backend Test Suite**: `make test-be` — 77/77 tests passing (100.00% code coverage).
- **Backend Linter**: `make lint-be` — Pylint rated 10.00/10.
- **Frontend Test Suite**: `make test-fe` — 13 test files, 37/37 tests passing (Vitest / Testing Library).
- **Frontend Type Safety**: `npx tsc --noEmit` — 0 TypeScript compilation errors.
- **Frontend Linter**: `make lint-fe` — ESLint passed with 0 errors.
