# ADR 0002: Frontend Framework, Component System, Data Table & Analytics Visualizations

## Status
Accepted

## Context
The HR Manager needs a responsive, performant, and visual dashboard to:
1. Browse, search, filter, and page through 10,000 employee salary records seamlessly.
2. Edit compensation details, job titles, and employee profiles via intuitive modal dialogs.
3. Gain instant analytics on compensation distribution, department averages, country totals, and gender pay parity via interactive charts.

## Decision Drivers
1. **User Experience & Modern Aesthetics**: Executive-ready UI with dark/light themes, visual hierarchy, and crisp charts.
2. **Table Performance**: Smooth pagination, debounced multi-column search, and sortable columns without UI stutter.
3. **Data Visualizations**: Responsive, interactive charts (bar charts, pie charts, metric stat cards).
4. **Maintainable Component Architecture**: Modular TypeScript components with clean separation of concerns.

## Considered Options
1. **Next.js (App Router / React 19) + Tailwind CSS + Lucide Icons + Recharts + SWR/TanStack Query** *(Selected)*
2. **Vite + React SPA + Material UI + Chart.js**
3. **Vanilla React SPA + Bootstrap**

## Decision: Next.js / React + Tailwind CSS + Custom Design System + Recharts + TanStack Query v5

We select **Next.js with Tailwind CSS, Lucide Icons, Recharts, and TanStack Query v5 (React Query)**.

### Rationale:
- **Next.js Framework**: Provides clean page routing, API proxying capabilities, and server/client hybrid rendering options.
- **Tailwind CSS & Modern Tokens**: Allows building high-quality, custom visual designs (glassmorphism cards, responsive grids, polished dark/light color schemes) without bloated CSS overhead.
- **Recharts for Data Visualization**: Composably renders responsive bar charts, donut charts, and trend graphs tailored for compensation analytics.
- **TanStack Query v5**: Industry-standard asynchronous state management library providing powerful query caching, automatic revalidation, query key management, mutation lifecycle hooks (`useMutation`), and Devtools for developer ergonomics.

## UI Component Breakdown

1. **Header & Global Navigation**: Branding, search bar shortcut, export action button, and theme/currency view toggles.
2. **Executive KPI Metric Grid**:
   - Total Annual Payroll (USD)
   - Average Salary & Median Salary
   - Active Employee Count
   - Highest & Lowest Salary Bands
3. **Interactive Analytics Section**:
   - Department Salary Spend & Headcount (Bar Chart)
   - Global Location Distribution (Pie / Donut Chart)
   - Gender & Pay Parity Metrics
4. **Data Management Section**:
   - Search bar (debounced 300ms)
   - Filters (Department dropdown, Country dropdown, Salary range slider)
   - Sortable Data Table with page controls
   - Add/Edit Employee Modal Drawer with input validation

## Consequences

### Positive:
- High performance UI with fast first-contentful-paint (FCP).
- Deep insight into ACME compensation metrics through visual charts.
- Sub-second UI updates when searching or filtering records.

### Negative / Mitigations:
- Large dataset rendering overhead if rendering 10,000 DOM nodes simultaneously.
  - *Mitigation*: Implemented server-side pagination (20/50/100 records per page) with server-side sorting and filtering, transferring only necessary data rows over the wire.
