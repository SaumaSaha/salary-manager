# Requirements & Product Framing Document: ACME Salary Manager

## 1. Product Goal

Build a performant, intuitive, web-based Employee Salary Management system for ACME Org (10,000 employees across multiple global offices). The software replaces manual Excel spreadsheets, enabling HR Managers to seamlessly manage salary data, conduct real-time compensation analysis, and answer strategic questions about organizational pay equity and distribution.

---

## 2. Target User Persona & Problem Statement

### User Persona
- **Role**: HR Manager at ACME Org
- **Technical Proficiency**: Comfortable with web tools and dashboards; not a developer
- **Typical Workflow**: Opens the system daily to review headcount, answer salary queries from leadership, process compensation changes during review cycles, and generate reports for finance audits

### Problem Statement
ACME manages 10,000 employees across 12 countries. Today, compensation data lives in fragmented Excel spreadsheets passed between HR team members. This causes:
1. **Data integrity issues** — duplicate rows, stale salary figures, inconsistent currency formatting
2. **Slow reporting** — answering "What is our average engineering salary in India vs. USA?" requires manual pivot tables across multiple files
3. **No audit trail** — changes to salary records are untraceable
4. **Currency chaos** — comparing compensation across countries requires manual FX lookups every time

---

## 3. Scope & Key Features (V1 MVP)

### 3.1 Data Engine & Seeding

#### FR-SEED-01: Standalone Seed Script
- The system SHALL provide a standalone Python seed script (`scripts/seed.py`) that populates exactly **10,000 employee records**.
- The script SHALL be **idempotent**: if records already exist, it SHALL clear and re-seed (with a `--reset` flag) or skip seeding.
- Seed data SHALL use the `faker` library with mixed locales (`en_US`, `en_GB`, `en_IN`, `ja_JP`, `fr_FR`, `en_CA`) to produce realistic multinational names.
- Seeding SHALL complete in under **5 seconds** using batch inserts (1,000 records per batch).
- The script SHALL support a `--count` flag to seed fewer records for fast local testing (e.g., `python scripts/seed.py --count 100`).
- **Rationale**: Seed data is environment-specific test data, not a schema change. Keeping it out of the Alembic migration chain avoids pulling `faker` into production dependencies, keeps migrations deterministic, and lets developers control when and how much data to seed.

#### FR-SEED-02: Employee Data Fields
Each employee record SHALL contain the following fields:

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID (string, 36 chars) | Primary key, auto-generated | Unique employee identifier |
| `first_name` | String (100) | Required | Employee first name |
| `last_name` | String (100) | Required | Employee last name |
| `email` | String (255) | Required, unique | Corporate email address |
| `job_title` | String (150) | Required | Current job title |
| `department` | String (100) | Required, indexed | Department name |
| `country` | String (100) | Required, indexed | Office country |
| `base_salary` | Float | Required, indexed, > 0 | Base salary in local currency |
| `currency` | String (10) | Required, enum: USD/EUR/GBP/INR/JPY/CAD | Local currency code |
| `usd_salary` | Float | Required, indexed, auto-computed | Normalized salary in USD |
| `bonus_percentage` | Float | Default: 0.0, range: 0–100 | Annual bonus as % of base |
| `gender` | String (20) | Required | Employee gender |
| `performance` | Integer | Default: 3, range: 1–5 | Latest performance rating |
| `hire_date` | DateTime | Required | Date of joining |
| `created_at` | DateTime | Auto-set on creation | Record creation timestamp |
| `updated_at` | DateTime | Auto-set on update | Last modification timestamp |

#### FR-SEED-03: Seeded Data Distribution
- **Departments** (8): Engineering, Product, Sales, Marketing, Finance, HR, Operations, Legal
- **Countries** (12): USA, UK, India, Japan, Germany, Canada, France, Australia, Singapore, Brazil, Nigeria, UAE
- **Salary ranges** SHALL be calibrated per country to reflect realistic compensation levels:
  - USA: $40,000 – $350,000 USD
  - India: ₹400,000 – ₹6,000,000 INR
  - UK: £25,000 – £200,000 GBP
  - Japan: ¥3,000,000 – ¥20,000,000 JPY
  - Canada: C$35,000 – C$250,000 CAD
  - EU countries: €30,000 – €200,000 EUR
- **Gender distribution**: Approximately balanced
- **Performance distribution**: Bell-curve centered around 3 (1–5 scale)

#### FR-SEED-04: Database Indexing
The database SHALL maintain indexes on the following columns for sub-50ms query performance:
- `department` (single-column index)
- `country` (single-column index)
- `base_salary` (single-column index)
- `usd_salary` (single-column index)
- `last_name, first_name` (composite index for name searches)

---

### 3.2 Employee Management (CRUD)

#### FR-CRUD-01: Paginated Employee List
- The system SHALL display employees in a paginated data table with server-side pagination.
- **Page sizes**: 20 (default), 50, 100 — selectable by the user.
- Each page request SHALL return a `pagination` object containing `page`, `page_size`, `total_records`, and `total_pages`.
- **Acceptance Criteria**: Navigating between pages SHALL complete in under 100ms perceived latency.

#### FR-CRUD-02: Multi-Column Sorting
- The table SHALL support sorting by: `first_name`, `last_name`, `department`, `country`, `base_salary`, `usd_salary`, `hire_date`, `performance`.
- Sort direction SHALL toggle between ascending and descending on column header click.
- Sort state SHALL be sent to the server (`sort_by`, `sort_order` query params) — not performed client-side.

#### FR-CRUD-03: Debounced Search
- A global search input SHALL filter employees by matching against `first_name`, `last_name`, `email`, and `job_title` simultaneously.
- Search SHALL be debounced at **300ms** to avoid excessive API calls during typing.
- Search SHALL be case-insensitive and support partial matches (e.g., "shar" matches "Sharma").
- **Acceptance Criteria**: Search results for any term SHALL render in under 200ms end-to-end.

#### FR-CRUD-04: Advanced Filtering
The user SHALL be able to filter the employee list by multiple criteria simultaneously:

| Filter | UI Element | Behavior |
| :--- | :--- | :--- |
| Department | Dropdown (multi-select) | Shows only unique department values from the dataset |
| Country | Dropdown (multi-select) | Shows only unique country values from the dataset |
| Salary Range | Dual-handle slider | Filters by `usd_salary` between min and max bounds |

- Filter dropdown options SHALL be loaded from the backend metadata endpoints (`/meta/departments`, `/meta/countries`, `/meta/salary-range`).
- A "Clear All Filters" button SHALL reset all filters and search to their default state.
- Filters SHALL compose with search — both are applied simultaneously.

#### FR-CRUD-05: Create Employee
- An "Add Employee" button SHALL open a modal form with all required fields.
- Required fields: `first_name`, `last_name`, `email`, `job_title`, `department`, `country`, `base_salary`, `currency`, `gender`, `performance`, `hire_date`.
- `bonus_percentage` SHALL default to 0 if not provided.
- `usd_salary` SHALL be auto-computed by the backend using the `currency_rates` DB table.
- `email` SHALL be validated for uniqueness — the API SHALL return a 409 Conflict if a duplicate is submitted.
- On success: modal closes, table revalidates, analytics KPIs refresh, success toast appears.

#### FR-CRUD-06: Update Employee
- Clicking an employee row (or an edit icon) SHALL open a pre-populated edit modal.
- All fields from FR-CRUD-05 SHALL be editable.
- If `base_salary` or `currency` changes, `usd_salary` SHALL be re-computed server-side.
- On success: modal closes, table revalidates, analytics refresh, success toast appears.

#### FR-CRUD-07: Delete Employee
- A delete action (icon/button on row) SHALL prompt a confirmation dialog before executing.
- On confirmation: `DELETE /api/v1/employees/{id}` is called.
- On success: row removed from table, analytics refresh, success toast appears.
- On failure (e.g., record not found): error toast with detail message.

---

### 3.3 Compensation Analytics & Pay Insights

#### FR-ANALYTICS-01: Executive KPI Summary Cards
The dashboard SHALL display the following metrics in a prominent card grid at the top of the page:

| Metric | Computation | Display Format |
| :--- | :--- | :--- |
| Total Annual Payroll | `SUM(usd_salary)` | `$485,000,000` (abbreviated as $485M if space constrained) |
| Average Salary | `AVG(usd_salary)` | `$48,500` |
| Median Salary | Middle value of `usd_salary` ordered ascending | `$45,200` |
| Employee Count | `COUNT(*)` | `10,000` |
| Highest Salary | `MAX(usd_salary)` | `$350,000` |
| Lowest Salary | `MIN(usd_salary)` | `$18,000` |

- All KPI values SHALL be computed in USD using the normalized `usd_salary` column.
- KPI cards SHALL refresh automatically after any CRUD mutation (create, update, delete).

#### FR-ANALYTICS-02: Department Breakdown Chart
- A **bar chart** SHALL display salary aggregates grouped by department.
- Each bar SHALL represent one department and show:
  - `employee_count` (headcount)
  - `total_payroll_usd` (total spend)
  - `average_salary_usd` (average per employee)
- The chart SHALL be interactive — hovering over a bar reveals a tooltip with all three values.

#### FR-ANALYTICS-03: Country Distribution Chart
- A **donut/pie chart** SHALL display employee distribution and payroll spend by country.
- Each segment SHALL show country name, headcount, and percentage of total payroll.
- The chart SHALL be interactive with hover tooltips.

#### FR-ANALYTICS-04: Gender Pay Parity Metrics
- A **comparison chart or grouped bar chart** SHALL display average salary by gender.
- The display SHALL include:
  - Average USD salary per gender
  - Headcount per gender
  - Pay gap percentage (if applicable)

#### FR-ANALYTICS-05: Analytics Refresh on Mutation
- All analytics queries SHALL be invalidated (via TanStack Query `queryClient.invalidateQueries`) after any employee create, update, or delete operation.
- Analytics SHALL reflect the current state of the dataset within **1 second** of a successful mutation.

---

### 3.4 Multi-Currency Handling

#### FR-CURRENCY-01: Local Currency Storage
- Employee salaries SHALL be stored in their **native local currency** (`base_salary` + `currency` fields).
- The frontend SHALL display the local currency value alongside the USD equivalent.

#### FR-CURRENCY-02: DB-Backed Exchange Rate Table
- Exchange rates SHALL be stored in a **`currency_rates` database table**, not hardcoded in source code.
- The seed script SHALL pre-populate the table with the following initial rates:

| Currency | Rate to 1 USD | Effective Date |
| :--- | :--- | :--- |
| USD | 1.00 | 2026-01-01 |
| EUR | 1.08 | 2026-01-01 |
| GBP | 1.27 | 2026-01-01 |
| INR | 0.012 | 2026-01-01 |
| JPY | 0.0067 | 2026-01-01 |
| CAD | 0.74 | 2026-01-01 |

- Rates are updatable via direct DB update — no admin UI in V1. An admin endpoint for rate management is a V2 candidate.
- **Rationale**: In most organizations, exchange rates are updated semi-annually and stored in the system of record. DB storage avoids code changes and redeployment for routine rate updates.

#### FR-CURRENCY-03: USD Normalization
- A normalized `usd_salary` column SHALL be computed and stored on every create and update operation.
- The conversion function SHALL read the rate from the `currency_rates` table (cached in-memory on app startup, refreshed on rate change).
- All analytics, sorting, filtering (salary range slider), and KPI computations SHALL use the `usd_salary` column.

#### FR-CURRENCY-04: Unsupported Currency Rejection
- If a create/update request contains a `currency` value not present in the `currency_rates` table, the API SHALL return a **422 Unprocessable Entity** error with a descriptive message.

---

### 3.5 Export

#### FR-EXPORT-01: CSV Export
- The system SHALL provide a "Download CSV" action accessible from the header or data table toolbar.
- The export SHALL apply the **currently active filters and search** — exporting only the visible subset, not the entire dataset.
- The CSV SHALL include all employee fields with a proper header row.
- The response SHALL use `Content-Type: text/csv` and `Content-Disposition: attachment; filename="employees_export.csv"`.

#### FR-EXPORT-02: Full Export Option
- If no filters or search are active, the export SHALL include all 10,000 records.
- The export SHALL stream the response to avoid loading the full dataset into memory.

---

## 4. Non-Functional Requirements

### NFR-01: Performance
| Metric | Target | Measurement Method |
| :--- | :--- | :--- |
| API response time (paginated list, filtered) | < 50ms | Server-side timing logged per request |
| API response time (analytics summary) | < 30ms | Server-side timing |
| Search response (end-to-end) | < 200ms | From keystroke to rendered results |
| Seeding 10,000 records | < 5 seconds | Script execution wall time |
| Frontend First Contentful Paint | < 1.5 seconds | Lighthouse audit |

### NFR-02: Reliability
- The backend SHALL return structured JSON error responses for all failure cases (400, 404, 409, 422, 500).
- No endpoint SHALL crash or return an HTML error page — all errors SHALL be caught by FastAPI exception handlers.
- Database writes SHALL be atomic — a failed create/update SHALL not leave partial records.

### NFR-03: Usability
- The interface SHALL be usable without training — standard CRUD affordances (add/edit/delete buttons, inline feedback).
- All interactive elements SHALL have unique, descriptive HTML `id` attributes for testing.
- The UI SHALL implement a dark/light theme toggle with smooth CSS transitions.
- Toast notifications SHALL appear for all mutation outcomes (success and failure).

### NFR-04: Accessibility
- All form inputs SHALL have associated `<label>` elements.
- Interactive elements SHALL be keyboard-navigable (Tab, Enter, Escape for modals).
- Color contrast SHALL meet WCAG 2.1 AA minimum contrast ratios (4.5:1 for normal text).

### NFR-05: Maintainability
- Backend code SHALL follow a three-layer architecture: Router → Service → Repository.
- Pydantic schemas SHALL enforce strict validation at the API boundary — no raw dict parsing in service or repository layers.
- TypeScript interfaces on the frontend SHALL mirror Pydantic response schemas.
- Minimum **80% test coverage** on backend business logic (services, repositories, currency conversion).

---

## 5. Deliberately Excluded Features & Engineering Trade-offs

| Excluded Feature | Engineering & Product Justification |
| :--- | :--- |
| **Enterprise OAuth/SAML & Multi-Tenant RBAC** | V1 focuses strictly on the HR Manager persona in a single-org context. Full SSO/OAuth integration adds identity provider infrastructure, token refresh flows, and session management overhead without increasing core salary management utility. A future V2 can add role-based middleware when multi-user access becomes a requirement. |
| **Direct Bank Payout Execution (ACH/Wire)** | Payment processing requires PCI-compliant banking integrations (Stripe Connect, Wise Business API, ACH Direct), regulatory KYC/AML compliance, and error reconciliation flows. This system is scoped to compensation *management and analytics*, not money transfer. Salary disbursement remains in the existing payroll system. |
| **Automated Global Tax & Statutory Deduction Engine** | Income tax, social security contributions, and statutory deductions vary by country, state/province, and employee classification — and change annually. Building a compliant tax engine requires partnerships with tax data providers (e.g., Symmetry, ADP). Tracking **gross compensation** provides 95%+ of HR planning and budgeting value without this complexity. |
| **Real-Time WebSocket Collaborative Editing** | Salary reviews happen in periodic cycles (annual reviews, promotion windows), not as continuous collaborative editing. Standard REST CRUD with optimistic UI updates is deterministic, simpler to debug, and avoids concurrency lock conflicts between users editing the same record. |
| **Custom SQL Query Sandbox / Ad-hoc Report Builder** | Exposing raw SQL execution creates SQL injection attack surface, allows unindexed queries that degrade database performance, and requires a permission model to restrict destructive operations. Pre-built analytics endpoints cover the standard HR reporting needs safely and with guaranteed performance. |
| **Historical Salary Versioning / Audit Log** | Tracking every salary change with timestamps and actor attribution requires an event-sourced or append-only audit table, plus a UI to browse version history. This is valuable but adds significant schema and UI complexity. V1 tracks current state only; audit logging is a strong V2 candidate. |
| **Mobile-Responsive Layout** | HR salary management is a desktop-first workflow — complex data tables, filter bars, and charts require wide-screen real estate. V1 optimizes for desktop viewports (≥1280px). Tablet/mobile layouts are deferred to reduce CSS complexity without impacting the primary use case. |

---

## 6. Technical Architecture Summary

### 6.1 Backend
- **Language**: Python 3.14+
- **Framework**: FastAPI (with automatic OpenAPI/Swagger documentation at `/docs`)
- **ORM**: SQLAlchemy 2.0 (Mapped columns, DeclarativeBase)
- **Validation**: Pydantic v2 (Rust-backed, high-performance serialization)
- **Database**: SQLite (embedded, zero-config, WAL mode for concurrent reads)
- **Testing**: Pytest + httpx `TestClient` for integration tests

### 6.2 Frontend
- **Framework**: Next.js (App Router, React 19)
- **Styling**: Tailwind CSS with custom design tokens
- **Charts**: Recharts (composable, responsive SVG charts)
- **Data Fetching & Async State**: TanStack Query v5 (React Query with intelligent caching, query key invalidation, and devtools)
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library

### 6.3 API Surface (13 Endpoints)
| Group | Endpoints |
| :--- | :--- |
| Employees CRUD | `GET /api/v1/employees`, `GET /api/v1/employees/{id}`, `POST /api/v1/employees`, `PUT /api/v1/employees/{id}`, `DELETE /api/v1/employees/{id}` |
| Analytics | `GET /api/v1/analytics/summary`, `GET /api/v1/analytics/by-department`, `GET /api/v1/analytics/by-country`, `GET /api/v1/analytics/by-gender` |
| Export | `GET /api/v1/export/csv` |
| Metadata | `GET /api/v1/meta/departments`, `GET /api/v1/meta/countries`, `GET /api/v1/meta/salary-range` |

### 6.4 Performance
- All API endpoints: < 50ms response time over 10,000 records
- Database query execution: < 10ms per indexed query
- Frontend First Contentful Paint: < 1.5s
- Seed script: < 5s for 10,000 records

---

## 7. Acceptance Criteria Summary

| ID | Criteria | Verification |
| :--- | :--- | :--- |
| AC-01 | Seed script creates exactly 10,000 records with all fields populated and valid | Automated test: assert `COUNT(*) = 10000` + field constraint checks |
| AC-02 | Paginated list returns correct page of 20 records with accurate `total_records` | API integration test |
| AC-03 | Search for "sharma" returns only matching employees within 200ms | API integration test with timing assertion |
| AC-04 | Filtering by department="Engineering" + country="India" returns correct subset | API integration test |
| AC-05 | Creating an employee with currency="INR" computes correct `usd_salary` | Unit test on currency conversion + API test |
| AC-06 | Duplicate email on create returns 409 Conflict | API integration test |
| AC-07 | KPI summary `total_payroll_usd` equals `SUM(usd_salary)` across all records | Automated test comparing API response to raw SQL |
| AC-08 | Median salary calculation is correct for both even and odd record counts | Unit test with known datasets |
| AC-09 | CSV export with active filters exports only the filtered subset | API test: apply filter, export, parse CSV, compare |
| AC-10 | Deleting an employee refreshes analytics within 1 second | Frontend integration test |
| AC-11 | Unsupported currency returns 422 error | API test |
| AC-12 | All API errors return structured JSON (not HTML) | Test all error paths |
