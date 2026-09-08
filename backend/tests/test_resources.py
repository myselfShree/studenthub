import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def create_authenticated_user_token(name_prefix="ResourceUser"):
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "name": f"{name_prefix} {suffix}",
        "email": f"{name_prefix.lower()}_{suffix}@studenthub.dev",
        "password": "Password123!"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    return response.json()["access_token"]

def test_resource_crud_filtering_and_search():
    token = create_authenticated_user_token("ResTester")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Subject
    sub_res = client.post("/api/v1/subjects", json={"name": "Software Engineering", "color": "#10B981"}, headers=headers)
    sub_id = sub_res.json()["id"]

    # 2. Create Resource 1 (Video linked to subject)
    res_payload1 = {
        "title": "Design Patterns in Python",
        "url": "https://youtube.com/watch?v=example1",
        "resource_type": "video",
        "notes": "Factory, Singleton, and Observer patterns",
        "subject_id": sub_id
    }
    res1 = client.post("/api/v1/resources", json=res_payload1, headers=headers)
    assert res1.status_code == 201
    res1_data = res1.json()
    assert res1_data["title"] == "Design Patterns in Python"
    assert res1_data["resource_type"] == "video"
    res1_id = res1_data["id"]

    # 3. Create Resource 2 (GitHub repo without subject)
    res_payload2 = {
        "title": "FastAPI RealWorld Example App",
        "url": "https://github.com/example/fastapi-realworld",
        "resource_type": "github",
        "notes": "Backend reference implementation"
    }
    res2 = client.post("/api/v1/resources", json=res_payload2, headers=headers)
    assert res2.status_code == 201
    res2_id = res2.json()["id"]

    # 4. Filter by subject_id
    sub_filter_res = client.get(f"/api/v1/resources?subject_id={sub_id}", headers=headers)
    assert sub_filter_res.status_code == 200
    assert len(sub_filter_res.json()) == 1
    assert sub_filter_res.json()[0]["id"] == res1_id
    assert sub_filter_res.json()[0]["subject"]["name"] == "Software Engineering"

    # 5. Filter by resource_type=github
    type_filter_res = client.get("/api/v1/resources?resource_type=github", headers=headers)
    assert type_filter_res.status_code == 200
    assert len(type_filter_res.json()) == 1
    assert type_filter_res.json()[0]["id"] == res2_id

    # 6. Search by keyword
    search_res = client.get("/api/v1/resources?search=Observer", headers=headers)
    assert search_res.status_code == 200
    assert len(search_res.json()) == 1
    assert search_res.json()[0]["id"] == res1_id

    # 7. Update Resource
    up_res = client.put(f"/api/v1/resources/{res1_id}", json={"title": "Design Patterns Masterclass"}, headers=headers)
    assert up_res.status_code == 200
    assert up_res.json()["title"] == "Design Patterns Masterclass"

    # 8. Delete Resource
    del_res = client.delete(f"/api/v1/resources/{res1_id}", headers=headers)
    assert del_res.status_code == 200
    assert client.get(f"/api/v1/resources/{res1_id}", headers=headers).status_code == 404

def test_tenant_isolation_on_resources():
    token_a = create_authenticated_user_token("UserA")
    token_b = create_authenticated_user_token("UserB")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates a resource
    res_a = client.post("/api/v1/resources", json={"title": "Private Resource A", "url": "https://example.com/a"}, headers=headers_a).json()

    # User B should NOT be able to view, edit, or delete User A's resource
    assert client.get(f"/api/v1/resources/{res_a['id']}", headers=headers_b).status_code == 404
    assert client.put(f"/api/v1/resources/{res_a['id']}", json={"title": "Hacked"}, headers=headers_b).status_code == 404
    assert client.delete(f"/api/v1/resources/{res_a['id']}", headers=headers_b).status_code == 404
