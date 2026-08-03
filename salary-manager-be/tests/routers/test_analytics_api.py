import pytest

def test_analytics_summary_api(client, sample_employee_payload):
    """Test GET /api/v1/analytics/summary returns correct KPI calculations."""
    # Employee 1: USD 100,000
    p1 = sample_employee_payload.copy()
    p1["email"] = "a1@acme.com"
    p1["base_salary"] = 100000.0
    client.post("/api/v1/employees", json=p1)

    # Employee 2: USD 200,000
    p2 = sample_employee_payload.copy()
    p2["email"] = "a2@acme.com"
    p2["base_salary"] = 200000.0
    client.post("/api/v1/employees", json=p2)

    response = client.get("/api/v1/analytics/summary")
    assert response.status_code == 200
    data = response.json()

    assert data["employee_count"] == 2
    assert data["total_payroll_usd"] == 300000.0
    assert data["average_salary_usd"] == 150000.0
    assert data["median_salary_usd"] == 150000.0
    assert data["highest_salary_usd"] == 200000.0
    assert data["lowest_salary_usd"] == 100000.0


def test_analytics_by_department_api(client, sample_employee_payload):
    """Test GET /api/v1/analytics/by-department aggregates per department."""
    p1 = sample_employee_payload.copy()
    p1["email"] = "d1@acme.com"
    p1["department"] = "Engineering"
    p1["base_salary"] = 100000.0
    client.post("/api/v1/employees", json=p1)

    p2 = sample_employee_payload.copy()
    p2["email"] = "d2@acme.com"
    p2["department"] = "Sales"
    p2["base_salary"] = 80000.0
    client.post("/api/v1/employees", json=p2)

    response = client.get("/api/v1/analytics/by-department")
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 2

    eng = next(item for item in items if item["department"] == "Engineering")
    assert eng["employee_count"] == 1
    assert eng["total_payroll_usd"] == 100000.0


def test_analytics_by_country_api(client, sample_employee_payload):
    """Test GET /api/v1/analytics/by-country aggregates per country."""
    p1 = sample_employee_payload.copy()
    p1["email"] = "c1@acme.com"
    p1["country"] = "USA"
    client.post("/api/v1/employees", json=p1)

    response = client.get("/api/v1/analytics/by-country")
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["country"] == "USA"


def test_analytics_by_gender_api(client, sample_employee_payload):
    """Test GET /api/v1/analytics/by-gender aggregates per gender."""
    p1 = sample_employee_payload.copy()
    p1["email"] = "g1@acme.com"
    p1["gender"] = "Female"
    client.post("/api/v1/employees", json=p1)

    response = client.get("/api/v1/analytics/by-gender")
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["gender"] == "Female"
