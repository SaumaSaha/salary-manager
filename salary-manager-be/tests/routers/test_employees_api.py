import pytest

def test_create_employee_api(client, sample_employee_payload):
    """Test POST /api/v1/employees endpoint."""
    response = client.post("/api/v1/employees", json=sample_employee_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == sample_employee_payload["email"]
    assert data["usd_salary"] == 120000.0
    assert "id" in data


def test_create_employee_duplicate_email_api(client, sample_employee_payload):
    """Test POST /api/v1/employees duplicate email returns 409 Conflict."""
    client.post("/api/v1/employees", json=sample_employee_payload)
    response = client.post("/api/v1/employees", json=sample_employee_payload)
    assert response.status_code == 409
    assert "already registered" in response.json()["detail"]


def test_list_employees_pagination_api(client, sample_employee_payload):
    """Test GET /api/v1/employees returns paginated result with meta."""
    # Create 5 employees
    for i in range(5):
        payload = sample_employee_payload.copy()
        payload["email"] = f"emp{i}@acme.com"
        client.post("/api/v1/employees", json=payload)

    response = client.get("/api/v1/employees?page=1&page_size=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["page_size"] == 2
    assert data["pagination"]["total_records"] == 5
    assert data["pagination"]["total_pages"] == 3


def test_list_employees_search_api(client, sample_employee_payload):
    """Test GET /api/v1/employees?search=sharma matches partial names."""
    payload = sample_employee_payload.copy()
    payload["last_name"] = "Sharma"
    payload["email"] = "sharma@acme.com"
    client.post("/api/v1/employees", json=payload)

    response = client.get("/api/v1/employees?search=shar")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["last_name"] == "Sharma"


def test_list_employees_filtering_api(client, sample_employee_payload):
    """Test GET /api/v1/employees with department, country, and salary filters."""
    # Employee 1: Engineering, USA, USD 120k
    payload1 = sample_employee_payload.copy()
    payload1["email"] = "e1@acme.com"
    client.post("/api/v1/employees", json=payload1)

    # Employee 2: Sales, UK, GBP 50k (USD 63.5k)
    payload2 = sample_employee_payload.copy()
    payload2["email"] = "e2@acme.com"
    payload2["department"] = "Sales"
    payload2["country"] = "UK"
    payload2["base_salary"] = 50000.0
    payload2["currency"] = "GBP"
    client.post("/api/v1/employees", json=payload2)

    # Filter for Engineering only
    resp_dept = client.get("/api/v1/employees?department=Engineering")
    assert resp_dept.status_code == 200
    assert len(resp_dept.json()["items"]) == 1
    assert resp_dept.json()["items"][0]["department"] == "Engineering"


def test_get_employee_by_id_api(client, sample_employee_payload):
    """Test GET /api/v1/employees/{id}."""
    create_resp = client.post("/api/v1/employees", json=sample_employee_payload)
    emp_id = create_resp.json()["id"]

    response = client.get(f"/api/v1/employees/{emp_id}")
    assert response.status_code == 200
    assert response.json()["id"] == emp_id


def test_update_employee_api(client, sample_employee_payload):
    """Test PUT /api/v1/employees/{id}."""
    create_resp = client.post("/api/v1/employees", json=sample_employee_payload)
    emp_id = create_resp.json()["id"]

    update_payload = {"job_title": "Lead Software Engineer", "base_salary": 150000.0}
    response = client.put(f"/api/v1/employees/{emp_id}", json=update_payload)
    assert response.status_code == 200
    assert response.json()["job_title"] == "Lead Software Engineer"
    assert response.json()["usd_salary"] == 150000.0


def test_delete_employee_api(client, sample_employee_payload):
    """Test DELETE /api/v1/employees/{id}."""
    create_resp = client.post("/api/v1/employees", json=sample_employee_payload)
    emp_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/v1/employees/{emp_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["message"] == "Employee deleted successfully"

    get_resp = client.get(f"/api/v1/employees/{emp_id}")
    assert get_resp.status_code == 404


def test_create_employee_invalid_payload_validation_error(client):
    """Test POST /api/v1/employees with invalid payload triggers custom 422 validation handler."""
    invalid_payload = {"first_name": "Jane", "email": "invalid-email"}
    response = client.post("/api/v1/employees", json=invalid_payload)
    assert response.status_code == 422
    data = response.json()
    assert data["detail"] == "Validation error in request payload or query parameters."
    assert "errors" in data

