import pytest
import uuid
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def create_authenticated_user_token(name_prefix="TaskUser"):
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "name": f"{name_prefix} {suffix}",
        "email": f"{name_prefix.lower()}_{suffix}@studenthub.dev",
        "password": "Password123!"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    return response.json()["access_token"]

def test_task_lifecycle_and_filtering():
    token = create_authenticated_user_token("TaskManager")
    headers = {"Authorization": f"Bearer {token}"}

    due_time = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()

    # 1. Create Task 1 (High priority, pending)
    payload1 = {
        "title": "Complete AI Lab 3",
        "description": "Implement A* search algorithm",
        "priority": "high",
        "status": "pending",
        "due_date": due_time
    }
    res1 = client.post("/api/v1/tasks", json=payload1, headers=headers)
    assert res1.status_code == 201
    task1 = res1.json()
    assert task1["title"] == "Complete AI Lab 3"
    assert task1["priority"] == "high"
    assert task1["status"] == "pending"
    task1_id = task1["id"]

    # 2. Create Task 2 (Low priority, completed)
    payload2 = {
        "title": "Buy Notebook",
        "description": "For class notes",
        "priority": "low",
        "status": "completed"
    }
    res2 = client.post("/api/v1/tasks", json=payload2, headers=headers)
    assert res2.status_code == 201
    task2_id = res2.json()["id"]

    # 3. Filter by status=pending
    res = client.get("/api/v1/tasks?status=pending", headers=headers)
    assert res.status_code == 200
    pending_tasks = res.json()
    assert len(pending_tasks) == 1
    assert pending_tasks[0]["id"] == task1_id

    # 4. Filter by priority=low
    res = client.get("/api/v1/tasks?priority=low", headers=headers)
    assert res.status_code == 200
    low_tasks = res.json()
    assert len(low_tasks) == 1
    assert low_tasks[0]["id"] == task2_id

    # 5. Quick status update (PATCH /api/v1/tasks/{id}/status)
    res = client.patch(f"/api/v1/tasks/{task1_id}/status", json={"status": "completed"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "completed"

    # 6. Full Update (PUT /api/v1/tasks/{id})
    res = client.put(f"/api/v1/tasks/{task1_id}", json={"title": "Complete AI Lab 3 - Finalized", "priority": "urgent"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["title"] == "Complete AI Lab 3 - Finalized"
    assert res.json()["priority"] == "urgent"

    # 7. Delete Task
    res = client.delete(f"/api/v1/tasks/{task1_id}", headers=headers)
    assert res.status_code == 200
    assert client.get(f"/api/v1/tasks/{task1_id}", headers=headers).status_code == 404

def test_tenant_isolation_on_tasks():
    token_a = create_authenticated_user_token("UserA")
    token_b = create_authenticated_user_token("UserB")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates a task
    task_a = client.post("/api/v1/tasks", json={"title": "Private Task A"}, headers=headers_a).json()

    # User B should NOT be able to view, patch, or delete User A's task
    assert client.get(f"/api/v1/tasks/{task_a['id']}", headers=headers_b).status_code == 404
    assert client.patch(f"/api/v1/tasks/{task_a['id']}/status", json={"status": "completed"}, headers=headers_b).status_code == 404
    assert client.delete(f"/api/v1/tasks/{task_a['id']}", headers=headers_b).status_code == 404
