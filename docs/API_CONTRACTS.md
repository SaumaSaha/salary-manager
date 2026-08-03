# ACME Salary Manager — API Contracts & Schema Specification

## Overview

The ACME Salary Manager backend exposes a RESTful HTTP JSON API designed for low-latency compensation management and real-time executive analytics across 10,000 employee records.

- **Base URL**: `http://localhost:8000/api/v1`
- **Interactive OpenAPI (Swagger) Docs**: `http://localhost:8000/docs`
- **ReDoc Interactive Reference**: `http://localhost:8000/redoc`

---

## Global Standards

### Response Headers
All JSON responses include the header:
`Content-Type: application/json; charset=utf-8`

### Standard Error Payload

When an API error occurs, the server returns a structured error object:

```json
{
  "detail": "Employee with ID 'a1b2c3d4-5678-90ab-cdef-1234567890ab' not found",
  "status_code": 404,
  "error_type": "NotFoundError"
}
```

#### HTTP Status Codes Used:
- `200 OK`: Request succeeded.
- `201 Created`: Employee record successfully created.
- `204 No Content`: Employee record successfully deleted.
- `400 Bad Request`: Invalid request parameters or constraint violation (e.g. duplicate email).
- `404 Not Found`: Requested resource ID does not exist.
- `422 Unprocessable Entity`: Request body violates Pydantic schema constraints.
- `500 Internal Server Error`: Unexpected database failure.

---

## 1. Employees CRUD Endpoints

### 1.1 List Employees (Paginated, Filtered, Sorted)

- **HTTP Method**: `GET`
- **Path**: `/api/v1/employees`
- **Description**: Returns a paginated list of employee records matching search keywords, department/country filters, and salary bounds.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `page` | Integer | No | `1` | Page number (1-indexed, minimum 1) |
| `page_size` | Integer | No | `20` | Items per page (1 to 100) |
| `search` | String | No | `null` | Case-insensitive search matching `first_name` or `last_name` |
| `department` | String | No | `null` | Exact department filter (e.g. `Engineering`) |
| `country` | String | No | `null` | Exact country filter (e.g. `India`) |
| `min_salary` | Float | No | `null` | Minimum `usd_salary` bound |
| `max_salary` | Float | No | `null` | Maximum `usd_salary` bound |
| `sort_by` | String | No | `created_at` | Sort column (`usd_salary`, `last_name`, `department`, `hire_date`, `created_at`) |
| `sort_order` | String | No | `desc` | Sort direction (`asc` or `desc`) |

#### Sample Response (`200 OK`)

```json
{
  "data": [
    {
      "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
      "first_name": "Priya",
      "last_name": "Sharma",
      "email": "priya.sharma@acme.com",
      "job_title": "Senior Staff Engineer",
      "department": "Engineering",
      "country": "India",
      "base_salary": 2800000.0,
      "currency": "INR",
      "usd_salary": 33600.0,
      "bonus_percentage": 12.5,
      "gender": "Female",
      "performance": 4,
      "hire_date": "2021-03-15T00:00:00Z",
      "created_at": "2026-08-01T10:00:00Z",
      "updated_at": "2026-08-01T10:00:00Z"
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

---

### 1.2 Create Employee

- **HTTP Method**: `POST`
- **Path**: `/api/v1/employees`
- **Description**: Creates a new employee record. Auto-computes `usd_salary` based on the currency exchange rate.

#### Sample Request Body (`EmployeeCreate`)

```json
{
  "first_name": "Alex",
  "last_name": "Rivera",
  "email": "alex.rivera@acme.com",
  "job_title": "Product Designer",
  "department": "Design",
  "country": "United States",
  "base_salary": 115000.0,
  "currency": "USD",
  "bonus_percentage": 10.0,
  "gender": "Non-Binary",
  "performance": 4,
  "hire_date": "2024-01-10T00:00:00Z"
}
```

#### Sample Response (`201 Created`)

```json
{
  "id": "e8f9a0b1-c2d3-4e5f-6a7b-8c9d0e1f2a3b",
  "first_name": "Alex",
  "last_name": "Rivera",
  "email": "alex.rivera@acme.com",
  "job_title": "Product Designer",
  "department": "Design",
  "country": "United States",
  "base_salary": 115000.0,
  "currency": "USD",
  "usd_salary": 115000.0,
  "bonus_percentage": 10.0,
  "gender": "Non-Binary",
  "performance": 4,
  "hire_date": "2024-01-10T00:00:00Z",
  "created_at": "2026-08-03T12:00:00Z",
  "updated_at": "2026-08-03T12:00:00Z"
}
```

---

### 1.3 Get Employee by ID

- **HTTP Method**: `GET`
- **Path**: `/api/v1/employees/{id}`
- **Description**: Retrieves single employee details by UUID string.

#### Sample Response (`200 OK`)

```json
{
  "id": "e8f9a0b1-c2d3-4e5f-6a7b-8c9d0e1f2a3b",
  "first_name": "Alex",
  "last_name": "Rivera",
  "email": "alex.rivera@acme.com",
  "job_title": "Product Designer",
  "department": "Design",
  "country": "United States",
  "base_salary": 115000.0,
  "currency": "USD",
  "usd_salary": 115000.0,
  "bonus_percentage": 10.0,
  "gender": "Non-Binary",
  "performance": 4,
  "hire_date": "2024-01-10T00:00:00Z",
  "created_at": "2026-08-03T12:00:00Z",
  "updated_at": "2026-08-03T12:00:00Z"
}
```

---

### 1.4 Update Employee

- **HTTP Method**: `PUT`
- **Path**: `/api/v1/employees/{id}`
- **Description**: Updates an existing employee profile. Recalculates `usd_salary` if `base_salary` or `currency` is updated.

#### Sample Request Body (`EmployeeUpdate`)

```json
{
  "job_title": "Lead Product Designer",
  "base_salary": 130000.0,
  "bonus_percentage": 12.5,
  "performance": 5
}
```

#### Sample Response (`200 OK`)

```json
{
  "id": "e8f9a0b1-c2d3-4e5f-6a7b-8c9d0e1f2a3b",
  "first_name": "Alex",
  "last_name": "Rivera",
  "email": "alex.rivera@acme.com",
  "job_title": "Lead Product Designer",
  "department": "Design",
  "country": "United States",
  "base_salary": 130000.0,
  "currency": "USD",
  "usd_salary": 130000.0,
  "bonus_percentage": 12.5,
  "gender": "Non-Binary",
  "performance": 5,
  "hire_date": "2024-01-10T00:00:00Z",
  "created_at": "2026-08-03T12:00:00Z",
  "updated_at": "2026-08-03T12:15:00Z"
}
```

---

### 1.5 Delete Employee

- **HTTP Method**: `DELETE`
- **Path**: `/api/v1/employees/{id}`
- **Description**: Permanently deletes an employee record.

#### Response (`204 No Content`)
(Empty payload body)

---

## 2. Executive Analytics Endpoints

### 2.1 Get KPI Summary

- **HTTP Method**: `GET`
- **Path**: `/api/v1/analytics/summary`
- **Description**: Computes organization-wide executive KPI metric card values directly in SQL.

#### Sample Response (`200 OK`)

```json
{
  "total_payroll_usd": 485000000.0,
  "average_salary_usd": 48500.0,
  "median_salary_usd": 45200.0,
  "employee_count": 10000,
  "highest_salary_usd": 350000.0,
  "lowest_salary_usd": 18000.0,
  "departments_count": 8,
  "countries_count": 12
}
```

---

### 2.2 Analytics by Department

- **HTTP Method**: `GET`
- **Path**: `/api/v1/analytics/by-department`
- **Description**: Returns departmental total payroll spend, headcount, average salary, and median salary.

#### Sample Response (`200 OK`)

```json
{
  "departments": [
    {
      "department": "Engineering",
      "employee_count": 2500,
      "total_payroll_usd": 162500000.0,
      "average_salary_usd": 65000.0,
      "median_salary_usd": 60000.0
    },
    {
      "department": "Sales",
      "employee_count": 1800,
      "total_payroll_usd": 99000000.0,
      "average_salary_usd": 55000.0,
      "median_salary_usd": 52000.0
    }
  ]
}
```

---

### 2.3 Analytics by Country

- **HTTP Method**: `GET`
- **Path**: `/api/v1/analytics/by-country`
- **Description**: Returns country-level employee count and payroll distribution percentage.

#### Sample Response (`200 OK`)

```json
{
  "countries": [
    {
      "country": "United States",
      "employee_count": 3500,
      "total_payroll_usd": 280000000.0,
      "percentage_of_payroll": 57.73
    },
    {
      "country": "India",
      "employee_count": 2200,
      "total_payroll_usd": 74800000.0,
      "percentage_of_payroll": 15.42
    }
  ]
}
```

---

### 2.4 Gender Pay Parity Analytics

- **HTTP Method**: `GET`
- **Path**: `/api/v1/analytics/by-gender`
- **Description**: Returns headcount, total spend, and average USD salary breakdown by gender.

#### Sample Response (`200 OK`)

```json
{
  "gender_metrics": [
    {
      "gender": "Female",
      "employee_count": 4850,
      "average_salary_usd": 48700.0,
      "total_payroll_usd": 236195000.0
    },
    {
      "gender": "Male",
      "employee_count": 4900,
      "average_salary_usd": 48300.0,
      "total_payroll_usd": 236670000.0
    }
  ]
}
```

---

## 3. CSV Export Endpoint

### 3.1 Export Filtered Dataset to CSV

- **HTTP Method**: `GET`
- **Path**: `/api/v1/export/csv`
- **Description**: Streams a CSV file attachment containing all employee records matching the supplied filter query parameters.
- **Accepts**: Same filter query parameters as `GET /api/v1/employees` (`search`, `department`, `country`, `min_salary`, `max_salary`).
- **Response Headers**:
  - `Content-Type: text/csv; charset=utf-8`
  - `Content-Disposition: attachment; filename="salary_export_2026-08-03.csv"`

---

## 4. Metadata / Filter Options Endpoints

### 4.1 Get Unique Departments
- **HTTP Method**: `GET`
- **Path**: `/api/v1/meta/departments`
- **Response (`200 OK`)**: `["Engineering", "Sales", "Marketing", "HR", "Finance", "Design", "Legal", "Operations"]`

### 4.2 Get Unique Countries
- **HTTP Method**: `GET`
- **Path**: `/api/v1/meta/countries`
- **Response (`200 OK`)**: `["United States", "India", "United Kingdom", "Germany", "Japan", "Canada", "Australia", "France"]`

### 4.3 Get Salary Range Bounds
- **HTTP Method**: `GET`
- **Path**: `/api/v1/meta/salary-range`
- **Response (`200 OK`)**: `{"min_salary_usd": 18000.0, "max_salary_usd": 350000.0}`
