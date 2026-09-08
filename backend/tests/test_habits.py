import pytest
import uuid
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def create_authenticated_user_token(name_prefix="HabitUser"):
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "name": f"{name_prefix} {suffix}",
        "email": f"{name_prefix.lower()}_{suffix}@studenthub.dev",
        "password": "Password123!"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    return response.json()["access_token"]

def test_habit_lifecycle_and_streak_calculation():
    token = create_authenticated_user_token("StreakTester")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Habit
    res = client.post("/api/v1/habits", json={"name": "Solve 1 LeetCode Problem", "target_frequency": "daily"}, headers=headers)
    assert res.status_code == 201
    habit = res.json()
    assert habit["name"] == "Solve 1 LeetCode Problem"
    assert habit["current_streak"] == 0
    assert habit["completed_today"] is False
    habit_id = habit["id"]

    # 2. Check-in for today
    today = date.today()
    res = client.post(f"/api/v1/habits/{habit_id}/checkin", json={"completed_date": today.isoformat()}, headers=headers)
    assert res.status_code == 201
    assert res.json()["completed_date"] == today.isoformat()

    # Verify Habit stats (current streak should be 1)
    res = client.get(f"/api/v1/habits/{habit_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["current_streak"] == 1
    assert res.json()["completed_today"] is True
    assert res.json()["total_completions"] == 1

    # 3. Check-in for yesterday and 2 days ago to simulate a 3-day streak
    yesterday = today - timedelta(days=1)
    two_days_ago = today - timedelta(days=2)

    client.post(f"/api/v1/habits/{habit_id}/checkin", json={"completed_date": yesterday.isoformat()}, headers=headers)
    client.post(f"/api/v1/habits/{habit_id}/checkin", json={"completed_date": two_days_ago.isoformat()}, headers=headers)

    # Verify streak is now 3
    res = client.get(f"/api/v1/habits/{habit_id}", headers=headers)
    assert res.json()["current_streak"] == 3
    assert res.json()["longest_streak"] == 3
    assert res.json()["total_completions"] == 3

    # 4. Duplicate check-in on same date (idempotent)
    res = client.post(f"/api/v1/habits/{habit_id}/checkin", json={"completed_date": today.isoformat()}, headers=headers)
    assert res.status_code == 201
    # total completions should still be 3
    res = client.get(f"/api/v1/habits/{habit_id}", headers=headers)
    assert res.json()["total_completions"] == 3

    # 5. Undo today's check-in
    res = client.delete(f"/api/v1/habits/{habit_id}/checkin?completed_date={today.isoformat()}", headers=headers)
    assert res.status_code == 200

    # Verify completed_today is now False, but current streak is still 2 (yesterday + 2 days ago)
    res = client.get(f"/api/v1/habits/{habit_id}", headers=headers)
    assert res.json()["completed_today"] is False
    assert res.json()["current_streak"] == 2
    assert res.json()["total_completions"] == 2

    # 6. Delete Habit
    res = client.delete(f"/api/v1/habits/{habit_id}", headers=headers)
    assert res.status_code == 200
    assert client.get(f"/api/v1/habits/{habit_id}", headers=headers).status_code == 404

def test_tenant_isolation_on_habits():
    token_a = create_authenticated_user_token("UserA")
    token_b = create_authenticated_user_token("UserB")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates a habit
    habit_a = client.post("/api/v1/habits", json={"name": "Morning Run"}, headers=headers_a).json()

    # User B should NOT be able to view, checkin, or delete User A's habit
    assert client.get(f"/api/v1/habits/{habit_a['id']}", headers=headers_b).status_code == 404
    assert client.post(f"/api/v1/habits/{habit_a['id']}/checkin", json={}, headers=headers_b).status_code == 404
    assert client.delete(f"/api/v1/habits/{habit_a['id']}", headers=headers_b).status_code == 404
