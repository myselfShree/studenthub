import pytest
import uuid
from datetime import date
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def create_authenticated_user_token(name_prefix="DashUser"):
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "name": f"{name_prefix} {suffix}",
        "email": f"{name_prefix.lower()}_{suffix}@studenthub.dev",
        "password": "Password123!"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    return response.json()["access_token"], payload["name"]

def test_dashboard_aggregation():
    token, student_name = create_authenticated_user_token("DashboardStudent")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Check initial empty dashboard
    res = client.get("/api/v1/dashboard/summary", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["student_name"] == student_name
    assert data["metrics"]["total_notes"] == 0
    assert data["metrics"]["total_tasks"] == 0

    # 2. Populate data across modules
    # Create Subject
    sub = client.post("/api/v1/subjects", json={"name": "Operating Systems", "color": "#F59E0B"}, headers=headers).json()

    # Create Note
    client.post("/api/v1/notes", json={"title": "Process Scheduling", "content": "Round Robin and FCFS", "subject_id": sub["id"]}, headers=headers)

    # Create Tasks (1 pending, 1 completed)
    client.post("/api/v1/tasks", json={"title": "OS Lab Assignment", "priority": "urgent", "status": "pending"}, headers=headers)
    client.post("/api/v1/tasks", json={"title": "Submit Form", "status": "completed"}, headers=headers)

    # Create Habit and Check-in for today
    habit = client.post("/api/v1/habits", json={"name": "Read Tech News", "target_frequency": "daily"}, headers=headers).json()
    client.post(f"/api/v1/habits/{habit['id']}/checkin", json={"completed_date": date.today().isoformat()}, headers=headers)

    # Create Resource
    client.post("/api/v1/resources", json={"title": "OS Lecture Notes", "url": "https://example.com/os", "resource_type": "pdf", "subject_id": sub["id"]}, headers=headers)

    # 3. Query Dashboard Summary again
    res = client.get("/api/v1/dashboard/summary", headers=headers)
    assert res.status_code == 200
    dash = res.json()

    # Verify Metrics Counts
    assert dash["metrics"]["total_subjects"] == 1
    assert dash["metrics"]["total_notes"] == 1
    assert dash["metrics"]["total_tasks"] == 2
    assert dash["metrics"]["total_habits"] == 1
    assert dash["metrics"]["total_resources"] == 1

    # Verify Tasks Breakdown
    assert dash["tasks"]["pending_count"] == 1
    assert dash["tasks"]["completed_count"] == 1
    assert dash["tasks"]["urgent_count"] == 1
    assert len(dash["tasks"]["upcoming_tasks"]) == 1
    assert dash["tasks"]["upcoming_tasks"][0]["title"] == "OS Lab Assignment"

    # Verify Habits Breakdown
    assert dash["habits"]["total_habits"] == 1
    assert dash["habits"]["completed_today_count"] == 1
    assert dash["habits"]["habits"][0]["current_streak"] == 1

    # Verify Recent Content Lists
    assert len(dash["recent_notes"]) == 1
    assert dash["recent_notes"][0]["title"] == "Process Scheduling"
    assert dash["recent_notes"][0]["subject"]["name"] == "Operating Systems"

    assert len(dash["recent_resources"]) == 1
    assert dash["recent_resources"][0]["title"] == "OS Lecture Notes"
