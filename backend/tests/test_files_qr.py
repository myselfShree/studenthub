import pytest
import io
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def create_authenticated_user_token(name_prefix="FileUser"):
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "name": f"{name_prefix} {suffix}",
        "email": f"{name_prefix.lower()}_{suffix}@studenthub.dev",
        "password": "Password123!"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    return response.json()["access_token"]

def test_file_upload_share_qr_and_download_flow():
    token = create_authenticated_user_token("ShareTester")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Upload a dummy study note PDF/text file
    file_content = b"Student Hub - Machine Learning Cheat Sheet Content."
    file_tuple = ("cheatsheet.txt", io.BytesIO(file_content), "text/plain")
    
    upload_res = client.post("/api/v1/files/upload", files={"file": file_tuple}, headers=headers)
    assert upload_res.status_code == 201
    file_data = upload_res.json()
    assert file_data["filename"] == "cheatsheet.txt"
    assert file_data["file_size"] == len(file_content)
    file_id = file_data["id"]

    # 2. List user files
    list_res = client.get("/api/v1/files", headers=headers)
    assert list_res.status_code == 200
    assert any(f["id"] == file_id for f in list_res.json())

    # 3. Create Share Token with max_downloads = 2
    share_payload = {
        "expires_in_hours": 24,
        "max_downloads": 2
    }
    share_res = client.post(f"/api/v1/files/{file_id}/share", json=share_payload, headers=headers)
    assert share_res.status_code == 201
    share_data = share_res.json()
    assert "share_token" in share_data
    assert "qr_code_url" in share_data
    token_str = share_data["share_token"]

    # 4. Fetch QR Code PNG stream
    qr_res = client.get(f"/api/v1/files/shared/{token_str}/qr")
    assert qr_res.status_code == 200
    assert qr_res.headers["content-type"] == "image/png"
    # Verify PNG Magic Bytes Header (\x89PNG)
    assert qr_res.content.startswith(b"\x89PNG")

    # 5. Public Share Info check
    info_res = client.get(f"/api/v1/files/shared/{token_str}")
    assert info_res.status_code == 200
    assert info_res.json()["filename"] == "cheatsheet.txt"
    assert info_res.json()["download_count"] == 0

    # 6. Public Download 1
    dl_res1 = client.get(f"/api/v1/files/shared/{token_str}/download")
    assert dl_res1.status_code == 200
    assert dl_res1.content == file_content

    # 7. Public Download 2
    dl_res2 = client.get(f"/api/v1/files/shared/{token_str}/download")
    assert dl_res2.status_code == 200
    assert dl_res2.content == file_content

    # 8. Public Download 3 (Exceeds limit of 2 -> 410 Gone)
    dl_res3 = client.get(f"/api/v1/files/shared/{token_str}/download")
    assert dl_res3.status_code == 410
    assert "limit reached" in dl_res3.json()["detail"]

    # 9. Delete file
    del_res = client.delete(f"/api/v1/files/{file_id}", headers=headers)
    assert del_res.status_code == 200
    assert client.get(f"/api/v1/files/{file_id}", headers=headers).status_code == 404

def test_tenant_isolation_on_files():
    token_a = create_authenticated_user_token("UserA")
    token_b = create_authenticated_user_token("UserB")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A uploads a file
    file_tuple = ("private.txt", io.BytesIO(b"Private user A file"), "text/plain")
    file_a = client.post("/api/v1/files/upload", files={"file": file_tuple}, headers=headers_a).json()

    # User B should NOT be able to view details, create shares, or delete User A's file
    assert client.get(f"/api/v1/files/{file_a['id']}", headers=headers_b).status_code == 404
    assert client.post(f"/api/v1/files/{file_a['id']}/share", json={}, headers=headers_b).status_code == 404
    assert client.delete(f"/api/v1/files/{file_a['id']}", headers=headers_b).status_code == 404
