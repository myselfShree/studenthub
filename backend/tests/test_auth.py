import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture
def unique_user_payload():
    unique_suffix = uuid.uuid4().hex[:8]
    return {
        "name": f"Student Test {unique_suffix}",
        "email": f"student_{unique_suffix}@studenthub.dev",
        "password": "SecurePassword123!"
    }

def test_user_registration(unique_user_payload):
    response = client.post("/api/v1/auth/register", json=unique_user_payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == unique_user_payload["email"].lower()
    assert data["user"]["name"] == unique_user_payload["name"]
    assert "password" not in data["user"]
    assert "password_hash" not in data["user"]

def test_duplicate_user_registration(unique_user_payload):
    # First registration
    client.post("/api/v1/auth/register", json=unique_user_payload)
    # Second registration with same email
    response = client.post("/api/v1/auth/register", json=unique_user_payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_user_login_success(unique_user_payload):
    client.post("/api/v1/auth/register", json=unique_user_payload)
    
    # Login via JSON
    response = client.post("/api/v1/auth/login", json={
        "email": unique_user_payload["email"],
        "password": unique_user_payload["password"]
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == unique_user_payload["email"].lower()

def test_user_login_wrong_password(unique_user_payload):
    client.post("/api/v1/auth/register", json=unique_user_payload)
    
    response = client.post("/api/v1/auth/login", json={
        "email": unique_user_payload["email"],
        "password": "WrongPassword!"
    })
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

def test_get_current_user_profile(unique_user_payload):
    reg_response = client.post("/api/v1/auth/register", json=unique_user_payload)
    token = reg_response.json()["access_token"]
    
    # Request profile with Bearer token
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == unique_user_payload["email"].lower()
    assert data["name"] == unique_user_payload["name"]

def test_protected_route_without_token():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

def test_update_profile(unique_user_payload):
    reg_response = client.post("/api/v1/auth/register", json=unique_user_payload)
    token = reg_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    update_payload = {"name": "Updated Name"}
    response = client.put("/api/v1/auth/me", json=update_payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"

def test_logout(unique_user_payload):
    reg_response = client.post("/api/v1/auth/register", json=unique_user_payload)
    token = reg_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post("/api/v1/auth/logout", headers=headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"
