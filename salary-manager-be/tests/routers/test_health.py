def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "project" in data
    assert "version" in data

def test_api_v1_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "docs" in data
    assert "health" in data

def test_ping_endpoint(client):
    response = client.get("/api/v1/ping")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "pong"
    assert data["service"] == "salary-manager-be"

