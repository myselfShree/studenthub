import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def create_authenticated_user_token(name_prefix="User"):
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "name": f"{name_prefix} {suffix}",
        "email": f"{name_prefix.lower()}_{suffix}@studenthub.dev",
        "password": "Password123!"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    return response.json()["access_token"]

def test_subject_crud():
    token = create_authenticated_user_token("SubjectTester")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Subject
    res = client.post("/api/v1/subjects", json={"name": "Machine Learning", "color": "#10B981"}, headers=headers)
    assert res.status_code == 201
    sub_data = res.json()
    assert sub_data["name"] == "Machine Learning"
    assert sub_data["color"] == "#10B981"
    sub_id = sub_data["id"]

    # 2. List Subjects
    res = client.get("/api/v1/subjects", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1
    assert any(s["id"] == sub_id for s in res.json())

    # 3. Get Subject by ID
    res = client.get(f"/api/v1/subjects/{sub_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["name"] == "Machine Learning"

    # 4. Update Subject
    res = client.put(f"/api/v1/subjects/{sub_id}", json={"name": "Applied ML", "color": "#EF4444"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["name"] == "Applied ML"
    assert res.json()["color"] == "#EF4444"

    # 5. Delete Subject
    res = client.delete(f"/api/v1/subjects/{sub_id}", headers=headers)
    assert res.status_code == 200

    # 6. Verify 404 after deletion
    res = client.get(f"/api/v1/subjects/{sub_id}", headers=headers)
    assert res.status_code == 404

def test_notes_crud_search_and_filter():
    token = create_authenticated_user_token("NotesTester")
    headers = {"Authorization": f"Bearer {token}"}

    # Create Subject
    sub_res = client.post("/api/v1/subjects", json={"name": "Computer Networks", "color": "#8B5CF6"}, headers=headers)
    sub_id = sub_res.json()["id"]

    # 1. Create Note linked to Subject
    note_payload = {
        "title": "TCP vs UDP",
        "content": "TCP is connection oriented and reliable. UDP is connectionless and fast.",
        "subject_id": sub_id
    }
    res = client.post("/api/v1/notes", json=note_payload, headers=headers)
    assert res.status_code == 201
    note1_data = res.json()
    assert note1_data["title"] == "TCP vs UDP"
    assert note1_data["subject_id"] == sub_id
    note1_id = note1_data["id"]

    # 2. Create standalone note
    note2_payload = {
        "title": "Exam Prep Tips",
        "content": "Review chapter 4 and solve previous year questions.",
        "subject_id": None
    }
    res2 = client.post("/api/v1/notes", json=note2_payload, headers=headers)
    assert res2.status_code == 201
    note2_id = res2.json()["id"]

    # 3. Filter by subject_id
    res = client.get(f"/api/v1/notes?subject_id={sub_id}", headers=headers)
    assert res.status_code == 200
    notes = res.json()
    assert len(notes) == 1
    assert notes[0]["id"] == note1_id
    assert notes[0]["subject"]["name"] == "Computer Networks"

    # 4. Search notes by keyword
    search_res = client.get("/api/v1/notes?search=UDP", headers=headers)
    assert search_res.status_code == 200
    assert len(search_res.json()) >= 1
    assert search_res.json()[0]["id"] == note1_id

    # 5. Update Note
    update_res = client.put(f"/api/v1/notes/{note1_id}", json={"title": "TCP vs UDP Protocols"}, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "TCP vs UDP Protocols"

    # 6. Delete Note
    del_res = client.delete(f"/api/v1/notes/{note1_id}", headers=headers)
    assert del_res.status_code == 200
    assert client.get(f"/api/v1/notes/{note1_id}", headers=headers).status_code == 404

def test_tenant_isolation_on_notes():
    token_a = create_authenticated_user_token("UserA")
    token_b = create_authenticated_user_token("UserB")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates a note
    note_a = client.post("/api/v1/notes", json={"title": "Secret Notes A", "content": "Private Content"}, headers=headers_a).json()

    # User B should NOT be able to view, edit, or delete User A's note
    assert client.get(f"/api/v1/notes/{note_a['id']}", headers=headers_b).status_code == 404
    assert client.put(f"/api/v1/notes/{note_a['id']}", json={"title": "Hacked"}, headers=headers_b).status_code == 404
    assert client.delete(f"/api/v1/notes/{note_a['id']}", headers=headers_b).status_code == 404
