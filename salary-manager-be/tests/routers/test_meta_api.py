import pytest

def test_meta_endpoints_api(client, sample_employee_payload):
    """Test metadata endpoints (/meta/departments, /meta/countries, /meta/salary-range)."""
    p1 = sample_employee_payload.copy()
    p1["email"] = "m1@acme.com"
    p1["department"] = "Engineering"
    p1["country"] = "USA"
    p1["base_salary"] = 100000.0
    client.post("/api/v1/employees", json=p1)

    p2 = sample_employee_payload.copy()
    p2["email"] = "m2@acme.com"
    p2["department"] = "Sales"
    p2["country"] = "UK"
    p2["base_salary"] = 200000.0
    client.post("/api/v1/employees", json=p2)

    # Departments meta
    dep_resp = client.get("/api/v1/meta/departments")
    assert dep_resp.status_code == 200
    deps = dep_resp.json()["departments"]
    assert "Engineering" in deps
    assert "Sales" in deps

    # Countries meta
    country_resp = client.get("/api/v1/meta/countries")
    assert country_resp.status_code == 200
    countries = country_resp.json()["countries"]
    assert "USA" in countries
    assert "UK" in countries

    # Salary range meta
    range_resp = client.get("/api/v1/meta/salary-range")
    assert range_resp.status_code == 200
    data = range_resp.json()
    assert data["min_usd_salary"] == 100000.0
    assert data["max_usd_salary"] == 200000.0
