import csv
import io
import pytest

def test_export_csv_api(client, sample_employee_payload):
    """Test GET /api/v1/export/csv returns valid CSV format."""
    p1 = sample_employee_payload.copy()
    p1["email"] = "ex1@acme.com"
    client.post("/api/v1/employees", json=p1)

    response = client.get("/api/v1/export/csv")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "attachment; filename=" in response.headers["content-disposition"]

    content = response.text
    reader = list(csv.reader(io.StringIO(content)))
    assert len(reader) >= 2  # Header + 1 record
    header = reader[0]
    assert "id" in header
    assert "email" in header
    assert "usd_salary" in header
    assert reader[1][header.index("email")] == "ex1@acme.com"
