# ADR 0002: Frontend Framework, Component System, Data Table & Analytics Visualizations

## Status
Accepted

## Context
The ACME Salary Manager requires an executive-ready, highly interactive visual dashboard to empower HR Leaders and Executives to:
1. **Explore & Manage 10,000 Records**: Search, filter, sort, and paginate through 10,000 employee compensation records seamlessly without browser freezing or render stutters.
2. **Execute Full CRUD Operations**: Create, view, update, and delete employee salary details via intuitive modal dialogs with client-side and server-side validation.
3. **Gain Real-Time Analytics Insights**: Inspect immediate compensation breakdowns, department spend analytics, country distributions, and gender pay equity metrics using dynamic, interactive data visualization charts.
4. **Perform Filtered Data Exports**: Instantly download filtered CSV exports for off-line executive reporting.

## Decision Drivers
1. **User Experience & Executive Aesthetics**: Clean visual hierarchy, crisp typography, responsive layout, dark/light theme toggle, and rich data visualization.
2. **Table Performance & Responsiveness**: Sub-100ms render speeds during search debouncing, sorting, and pagination across massive datasets.
3. **Data Visualizations**: Responsive, interactive charts (Bar charts, Donut charts, Metric stat cards) with theme synchronization.
4. **State Management Ergonomics**: Declarative asynchronous data fetching, intelligent query caching, automatic cache invalidation, and UI optimistic feedback.

## Considered Options
1. **Next.js (App Router / React 19) + Tailwind CSS + Lucide Icons + Recharts + TanStack Query v5** *(Selected)*
2. **Vite + React SPA + Material UI + Chart.js**
3. **Vanilla React SPA + Bootstrap**

---

## Decision: Next.js / React + Tailwind CSS + Custom Design System + Recharts + TanStack Query v5

We select **Next.js (React 19)** with **Tailwind CSS**, **Lucide Icons**, **Recharts**, and **TanStack Query v5**.

### Key Architectural Rationale:
- **Next.js Framework**: Modern React framework providing fast client navigation, component code-splitting, API proxying capabilities, and robust production build pipelines.
- **Tailwind CSS Utility Tokens**: Direct control over styling tokens (custom glassmorphism surfaces, dark/light mode toggles, custom color scales, smooth micro-interactions) without CSS runtime bundle bloat.
- **TanStack Query v5 (React Query)**: Enterprise standard asynchronous state management library providing declarative query caching (`staleTime`, `gcTime`), automatic background refetching, mutation hooks (`useMutation`), query invalidation (`queryClient.invalidateQueries`), and optimism.
- **Recharts Data Visualization**: Highly flexible, responsive SVG chart library designed for React applications. Renders crisp bar charts, donut charts, and legend overlays tailored for salary breakdown analytics.

---

## Architecture Diagrams

### 1. Frontend Component Tree Hierarchy Architecture

```
App (Next.js App Router)
├── Layout (src/app/layout.tsx)
│   ├── Navbar (src/components/Navbar.tsx)
│   │   ├── BrandLogo & Title
│   │   ├── ExportCSVButton
│   │   ├── ThemeToggle (Dark / Light)
│   │   └── CurrencyViewToggle (USD / Local)
│   │
│   └── Main Content Dashboard (src/app/page.tsx)
│       ├── KPICards (src/components/KPICards.tsx)
│       │   ├── Total Payroll Card
│       │   ├── Average Salary Card
│       │   ├── Median Salary Card
│       │   ├── Headcount Card
│       │   └── Min/Max Salary Card
│       │
│       ├── AnalyticsCharts (src/components/AnalyticsCharts.tsx)
│       │   ├── DepartmentBarChart (Spend & Headcount)
│       │   ├── CountryDonutChart (Global Distribution)
│       │   └── GenderPayParityChart (Pay Equity)
│       │
│       ├── FilterToolbar (src/components/FilterToolbar.tsx)
│       │   ├── DebouncedSearchInput (300ms delay)
│       │   ├── DepartmentSelectDropdown
│       │   ├── CountrySelectDropdown
│       │   └── ClearFiltersButton
│       │
│       ├── EmployeeTable (src/components/EmployeeTable.tsx)
│       │   ├── SortableColumnHeader (Name, Salary, Dept, Country)
│       │   ├── EmployeeTableRowActions (Edit, Delete)
│       │   └── TablePaginationControls (Prev, Next, Page Size)
│       │
│       ├── EmployeeModal (src/components/EmployeeModal.tsx)
│       │   └── EmployeeFormDrawer (Create / Edit Validation)
│       │
│       └── DeleteConfirmModal (src/components/DeleteConfirmModal.tsx)
│           └── HardDeleteConfirmationDialog
```

---

### 2. Data Fetching, Caching, and Hydration Flow

```
UI Component             TanStack Query            API Service             FastAPI Backend
  │                           │                         │                         │
  │ useQuery(['employees'])   │                         │                         │
  │ ───────────────────────▶  │                         │                         │
  │                           │ Check Cache             │                         │
  │                           │ ┌───────────────┐       │                         │
  │                           │ │ Fresh Data?   │       │                         │
  │                           │ └───────┬───────┘       │                         │
  │                           │     [No / Stale]        │                         │
  │                           │ ────────┴──────────▶    │                         │
  │                           │                         │ fetchEmployees(params)  │
  │                           │                         │ ─────────────────────▶  │
  │                           │                         │                         │ GET /api/v1/employees
  │                           │                         │                         │ ───▶ Return JSON
  │                           │                         │ ◀─────────────────────  │
  │                           │ ◀─────────────────────  │                         │
  │                           │ Update Cache Store      │                         │
  │ ◀───────────────────────  │                         │                         │
  │  Render Fresh UI Rows     │                         │                         │
```

---

### 3. State Management Matrix Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│                        STATE MANAGEMENT TOPOLOGY                       │
├──────────────────┬──────────────────┬──────────────────┬───────────────┤
│ State Type       │ Storage Location │ Data Managed     │ Scope         │
├──────────────────┼──────────────────┼──────────────────┼───────────────┤
│ URL SearchParams │ Browser URL      │ search, dept,    │ Shareable &   │
│                  │ (?page=1&...)    │ country, page    │ Persistent    │
├──────────────────┼──────────────────┼──────────────────┼───────────────┤
│ Local Component  │ useState /       │ Modal state,     │ Transient     │
│ State            │ useRef           │ form draft values│ Component     │
├──────────────────┼──────────────────┼──────────────────┼───────────────┤
│ Server Cache     │ TanStack Query   │ Employee list,   │ Global Query  │
│ State            │ Query Cache      │ Analytics stats  │ Cache         │
├──────────────────┼──────────────────┼──────────────────┼───────────────┤
│ Context State    │ React Context    │ Dark mode,       │ Application   │
│                  │                  │ Currency mode    │ Wide          │
└──────────────────┴──────────────────┴──────────────────┴───────────────┘
```

---

### 4. Employee Mutation & Cache Invalidation Workflow

```
User             EmployeeModal           useMutation          FastAPI Backend       QueryCache
 │                     │                      │                      │                   │
 │ Click Save          │                      │                      │                   │
 │ ─────────────────▶  │                      │                      │                   │
 │                     │ Validate & Submit    │                      │                   │
 │                     │ ──────────────────▶  │                      │                   │
 │                     │                      │ POST /api/v1/emp     │                   │
 │                     │ ──────────────────▶  │                   │
 │                     │                      │ ◀──────────────────  │                   │
 │                     │                      │ HTTP 201 Created     │                   │
 │                     │                      │                                          │
 │                     │                      │ Invalidate ['employees', 'analytics']    │
 │                     │                      │ ───────────────────────────────────────▶ │
 │                     │                      │                                          │
 │                     │                      │                                   Refetch Queries
 │ ◀─────────────────  │                      │                                   ──────────────▶
 │  Toast & Close      │                      │                                   Table Updates
```

---

## Modular Component System Specifications

### Component Directory & Responsibility Table

| Component File | Location | Primary Purpose & Features | Key Props / Hooks |
| :--- | :--- | :--- | :--- |
| `Navbar.tsx` | `src/components/` | Header navigation, branding, CSV export trigger, dark/light theme switch, currency toggle (USD vs Local). | Theme state toggle handler, currency view toggle |
| `KPICards.tsx` | `src/components/` | Executive stat metrics: Total Payroll (USD), Average Salary, Median Salary, Employee Count, Min/Max Band. | `useQuery(['analytics-summary'])` |
| `AnalyticsCharts.tsx` | `src/components/` | Interactive Recharts visualizations: Department spend (Bar chart), Country distribution (Donut chart), Pay equity. | `useQuery(['analytics-department', 'analytics-country'])` |
| `FilterToolbar.tsx` | `src/components/` | Debounced search bar (300ms delay), Department filter dropdown, Country filter dropdown, Reset button. | `search`, `department`, `country`, `onSearchChange`, `onDeptChange` |
| `EmployeeTable.tsx` | `src/components/` | Server-paginated data grid, sortable column headers, action buttons (Edit, Delete), page controls. | `employees`, `pagination`, `onPageChange`, `onEditClick`, `onDeleteClick` |
| `EmployeeModal.tsx` | `src/components/` | Form drawer for adding new employees or editing existing compensation & profile details with validation. | `isOpen`, `onClose`, `employeeToEdit` |
| `DeleteConfirmModal.tsx` | `src/components/` | Confirmation modal dialog before performing hard deletion of an employee record. | `isOpen`, `onClose`, `employeeToDelete`, `onConfirmDelete` |

---

## Data Table & Filter System Architecture

- **Debounced Search Engine**: The search input field utilizes a `useDebounce` hook (300ms delay) to prevent sending unnecessary HTTP queries on every keystroke, delivering smooth input reactivity.
- **Server-Side Pagination Controls**: Page controls (`Previous`, `Next`, page jump) send updated `page` parameters to the backend. DOM nodes are rendered strictly for the current page size (20/50/100 records), avoiding heavy DOM memory footprint.
- **URL Search Parameter Synchronization**: Filter states are bidirectionally synchronized with browser URL parameters (`?page=1&department=Engineering`), enabling shareable dashboard views and full browser history navigation.

---

## Executive Analytics & Data Visualizations (Recharts)

1. **Department Salary Spend Chart**: Responsive `BarChart` comparing total USD payroll spend and average salary across departments (Engineering, Sales, Marketing, HR, Finance, etc.).
2. **Global Country Distribution Chart**: Responsive `PieChart` / `Pie` (Donut format) visualizing workforce representation across global office hubs (USA, India, UK, Germany, Japan, Canada, etc.).
3. **Currency Conversion Display Mode**: Real-time display toggle permitting users to switch between normalized USD amounts and local currency values.

---

## Performance & Memory Management Strategies

- **Server-Side Pagination**: Only 20 to 100 employee records are fetched and present in the DOM at any given moment, mitigating memory leaks for 10,000 dataset operations.
- **Query Caching (`staleTime: 30000`)**: TanStack Query caches fetched endpoints for 30 seconds (`staleTime`), preventing redundant network fetches when switching tabs or toggling filters.
- **React Component Optimization**: Pure presentation components use memoized callbacks (`useCallback`) and component memoization (`React.memo`) to avoid unneeded re-renders when parent layout state updates.

---

## Testing & Quality Assurance

- **Jest + React Testing Library**: Component unit tests cover component rendering, user interactions (modal submission, delete trigger, search typing), and filter state updates.
- **Service Layer Unit Tests**: Mocked HTTP service calls test API error handling, response parsing, and mutation lifecycle handlers.

---

## Consequences

### Positive:
- High performance, responsive executive dashboard with fast first contentful paint (FCP).
- Instant insights into organizational salary metrics through visual Recharts charts.
- Sub-second UI updates when searching, sorting, or filtering records.

### Negative / Mitigations:
- Recharts bundle size footprint.
  - *Mitigation*: Dynamically import Recharts component submodules so visual analytics code is chunked and loaded lazily without delaying core table FCP.
