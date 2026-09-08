import pytest
import uuid
from datetime import date
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def create_authenticated_user_token(name_prefix="JournalUser"):
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "name": f"{name_prefix} {suffix}",
        "email": f"{name_prefix.lower()}_{suffix}@studenthub.dev",
        "password": "Password123!"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    return response.json()["access_token"]

def test_daily_journal_flow():
    token = create_authenticated_user_token("JournalTester")
    headers = {"Authorization": f"Bearer {token}"}

    # Save today's 3-point journal
    save_res = client.post("/api/v1/journal", headers=headers, json={
        "point_win": "Completed calculus problem set",
        "point_insight": "Understood integration by parts visually",
        "point_improvement": "Start physics revision earlier"
    })
    assert save_res.status_code == 200
    data = save_res.json()
    assert data["point_win"] == "Completed calculus problem set"
    assert data["point_insight"] == "Understood integration by parts visually"
    assert data["point_improvement"] == "Start physics revision earlier"

    # Get today's journal
    get_res = client.get("/api/v1/journal/today", headers=headers)
    assert get_res.status_code == 200
    today_data = get_res.json()
    assert today_data is not None
    assert today_data["id"] == data["id"]

    # Update journal entry
    update_res = client.post("/api/v1/journal", headers=headers, json={
        "point_win": "Completed calculus problem set and chemistry lab",
        "point_insight": "Understood integration by parts visually",
        "point_improvement": "Sleep 8 hours"
    })
    assert update_res.status_code == 200
    assert update_res.json()["point_win"] == "Completed calculus problem set and chemistry lab"
    assert update_res.json()["point_improvement"] == "Sleep 8 hours"

    # Fetch history
    hist_res = client.get("/api/v1/journal/history", headers=headers)
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) == 1
