from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Student Hub" in data["message"]
    assert data["docs"] == "/docs"
    assert data["version"] == "0.1.0"

def test_health_check_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["database"]["status"] == "healthy"
    assert "latency_ms" in data["database"]
