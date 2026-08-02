# Requirements & Product Framing Document: ACME Salary Manager

## 1. Product Goal
Build a performant, intuitive, web-based Employee Salary Management system for ACME Org (10,000 employees across multiple global offices). The software replaces manual Excel spreadsheets, enabling HR Managers to seamlessly manage salary data, conduct real-time compensation analysis, and answer strategic questions about organizational pay equity and distribution.

---

## 2. Target User Persona & Problem Statement
- **User Persona**: HR Manager at ACME Org.
- **Problem Statement**: Managing 10,000 employees' salary data across multiple countries in Excel spreadsheets is tedious, error-prone, lacks centralized security, and makes answering executive queries on org-wide pay distribution slow and difficult.

---

## 3. Scope & Key Features (V1 MVP)

### A. High-Performance Data Engine & Seeding
- **10,000 Employee Dataset**: Seeding script populating 10,000 realistic employee records with fields: Employee ID, Name, Job Title, Department, Country/Location, Base Salary, Currency, Bonus %, Performance Rating, Hire Date.
- **Indexed Relational Database**: SQLite/PostgreSQL with indexed fields (`department`, `country`, `salary`, `name`) for sub-50ms search and filter operations.

### B. HR Salary Management Interface
- **Data Table with Pagination & Debounced Search**: Fast rendering of 10k records with server-side pagination, instant multi-field search, and multi-column sorting.
- **Advanced Filtering**: Filter by Department, Location/Country, Salary Tier, and Employment Status.
- **Full CRUD Support**: Add new employees, update salary/compensation details, adjust titles/departments, and delete records via an intuitive modal interface.

### C. Compensation Analytics & Pay Insights ("How the Org Pays")
- **Executive Summary KPI Cards**: Total Payroll Spend (USD), Average Base Salary, Median Salary, Top Salary Bands.
- **Pay Distribution Visualizations**: Departmental salary breakdown, Country-wise payroll comparison, and Gender/Level pay equity metrics.
- **Multi-Currency Normalization**: Store local currencies while dynamically converting to USD standard for unified organizational benchmarking.

### D. Export Capabilities
- **CSV Data Export**: Export current filter views or complete reports for executive presentation and auditing.

---

## 4. Deliberately Excluded Features & Engineering Trade-offs

| Excluded Feature | Engineering & Product Justification |
| :--- | :--- |
| **Enterprise OAuth/SAML & Multi-Tenant RBAC** | V1 focuses strictly on the HR Manager persona. Complex OAuth/SSO integration adds infrastructure complexity without adding core value to compensation tracking and analytics for V1. |
| **Direct Bank Payout Execution (ACH/Wire)** | Banking API integration (Stripe Connect/Wise) is out of scope. The system is designed for compensation management, analytics, and budgeting, not financial transaction execution. |
| **Automated Local Tax Engine** | Local tax codes across global jurisdictions change continuously. Tracking Gross Total Compensation yields 95%+ of HR decision value without the burden of maintaining external tax compliance services. |
| **Real-Time WebSockets Collaborative Editing** | Salary updates happen in periodic cycles (reviews, promotions). Standard REST/GraphQL CRUD with optimistic UI updates provides determinism, reliability, and simplicity without WebSocket sync overhead. |
| **Custom SQL Query Sandbox** | Exposing raw SQL or ad-hoc query builders introduces security hazards (SQL injection) and unindexed query performance risks. Pre-compiled API aggregations cover standard HR reporting safely and quickly. |

---

## 5. Technical Architecture & Quality Standards
- **Architecture**: Next.js / React (UI) + Node.js/Express (API) + SQLite/Prisma ORM.
- **Test Strategy**: Comprehensive unit tests for salary math, currency conversions, DB seeding, API controllers, and frontend visual components.
- **Performance Budget**: <50ms API response time for filtered queries over 10,000 employee records.
