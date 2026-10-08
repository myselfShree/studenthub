import pytest
import uuid
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from tests.conftest import TestingSessionLocal
from app.models.note import Note
from app.models.task import Task
from app.core.security import get_password_hash

client = TestClient(app)


def generate_alpha_username(prefix="Student") -> str:
    """Generate a valid alphabetic-only username."""
    unique_alpha = "".join([c for c in uuid.uuid4().hex if c.isalpha()])[:6]
    return f"{prefix}{unique_alpha.capitalize()}"


@pytest.fixture
def unique_user_payload():
    username = generate_alpha_username("Alex")
    unique_suffix = uuid.uuid4().hex[:6]
    return {
        "name": username,
        "email": f"user_{unique_suffix}@studenthub.dev",
        "password": "SecurePassword123!"
    }


# ══════════════════════════════════════════════════════════════════════════════
# 1. SIGNUP / REGISTRATION TESTS
# ══════════════════════════════════════════════════════════════════════════════

def test_signup_valid(unique_user_payload):
    """Valid registration with alphabetic username and strong password."""
    response = client.post("/api/v1/auth/register", json=unique_user_payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == unique_user_payload["email"].lower()
    assert data["user"]["name"] == unique_user_payload["name"]
    assert "password" not in data["user"]
    assert "password_hash" not in data["user"]


def test_signup_empty_username(unique_user_payload):
    """Empty username must be rejected."""
    payload = {**unique_user_payload, "name": ""}
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_signup_username_with_numbers(unique_user_payload):
    """Username containing numbers (e.g. shree123) must be rejected."""
    for invalid in ["shree123", "123shree", "Shree2026"]:
        payload = {**unique_user_payload, "name": invalid}
        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 422
        assert "alphabets only" in response.text.lower()


def test_signup_username_with_special_characters(unique_user_payload):
    """Username containing special characters (e.g. shree@123, shree_yadwad) must be rejected."""
    for invalid in ["shree@123", "shree_yadwad", "Shrikant-Yadwad", "Alex!"]:
        payload = {**unique_user_payload, "name": invalid}
        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 422
        assert "alphabets only" in response.text.lower()


def test_signup_username_with_spaces(unique_user_payload):
    """Username containing spaces (e.g. shree yadwad) must be rejected."""
    for invalid in ["shree yadwad", "Shrikant Yadwad", " Alex"]:
        payload = {**unique_user_payload, "name": invalid}
        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 422
        assert "alphabets only" in response.text.lower()


def test_signup_username_too_short(unique_user_payload):
    """Username shorter than 2 characters must be rejected."""
    payload = {**unique_user_payload, "name": "A"}
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_signup_username_too_long(unique_user_payload):
    """Username longer than 30 characters must be rejected."""
    payload = {**unique_user_payload, "name": "A" * 31}
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_signup_invalid_email(unique_user_payload):
    """Invalid email format must be rejected."""
    for invalid_email in ["notanemail", "user@", "@domain.com", "user@domain"]:
        payload = {**unique_user_payload, "email": invalid_email}
        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 422


def test_signup_duplicate_email(unique_user_payload):
    """Duplicate email registration must return 400 error."""
    client.post("/api/v1/auth/register", json=unique_user_payload)
    response = client.post("/api/v1/auth/register", json=unique_user_payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()


# ══════════════════════════════════════════════════════════════════════════════
# 2. PASSWORD SECURITY TESTS
# ══════════════════════════════════════════════════════════════════════════════

def test_signup_password_too_short(unique_user_payload):
    """Password shorter than 8 characters must be rejected."""
    payload = {**unique_user_payload, "password": "Sh@123"}  # 6 chars
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422
    assert "8 characters" in response.text.lower()


def test_signup_password_missing_uppercase(unique_user_payload):
    """Password without uppercase letter must be rejected."""
    payload = {**unique_user_payload, "password": "shree@123"}
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422
    assert "uppercase" in response.text.lower()


def test_signup_password_missing_lowercase(unique_user_payload):
    """Password without lowercase letter must be rejected."""
    payload = {**unique_user_payload, "password": "SHREE@123"}
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422
    assert "lowercase" in response.text.lower()


def test_signup_password_missing_number(unique_user_payload):
    """Password without digit must be rejected."""
    payload = {**unique_user_payload, "password": "Shree@Yadwad"}
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422
    assert "number" in response.text.lower()


def test_signup_password_missing_special_character(unique_user_payload):
    """Password without special character must be rejected."""
    payload = {**unique_user_payload, "password": "Shree1234"}
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422
    assert "special character" in response.text.lower()


# ══════════════════════════════════════════════════════════════════════════════
# 3. LOGIN & SESSION TESTS
# ══════════════════════════════════════════════════════════════════════════════

def test_login_success(unique_user_payload):
    """Valid credentials authenticate and return token without password hash."""
    client.post("/api/v1/auth/register", json=unique_user_payload)
    response = client.post("/api/v1/auth/login", json={
        "email": unique_user_payload["email"],
        "password": unique_user_payload["password"]
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == unique_user_payload["email"].lower()
    assert "password_hash" not in data["user"]


def test_login_wrong_password(unique_user_payload):
    """Wrong password must return 401."""
    client.post("/api/v1/auth/register", json=unique_user_payload)
    response = client.post("/api/v1/auth/login", json={
        "email": unique_user_payload["email"],
        "password": "WrongPassword@123"
    })
    assert response.status_code == 401
    assert "incorrect email or password" in response.json()["detail"].lower()


def test_login_nonexistent_email():
    """Non-existent email must return 401 with generic message."""
    response = client.post("/api/v1/auth/login", json={
        "email": "nobody@studenthub.dev",
        "password": "SecurePassword123!"
    })
    assert response.status_code == 401
    assert "incorrect email or password" in response.json()["detail"].lower()


def test_login_empty_fields():
    """Empty login fields must return 422 validation error."""
    response = client.post("/api/v1/auth/login", json={"email": "", "password": ""})
    assert response.status_code == 422


def test_logout(unique_user_payload):
    """Authenticated logout endpoint."""
    reg = client.post("/api/v1/auth/register", json=unique_user_payload)
    token = reg.json()["access_token"]
    response = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert "logged out" in response.json()["message"].lower()


def test_protected_route_without_token():
    """Accessing protected endpoint without Authorization header must return 401."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_protected_route_with_invalid_token():
    """Accessing protected endpoint with bogus token must return 401."""
    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer bogus-token-xyz"})
    assert response.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# 4. FORGOT PASSWORD & PASSWORD RESET TESTS
# ══════════════════════════════════════════════════════════════════════════════

def test_forgot_password_enumeration_safe(unique_user_payload):
    """Endpoint must return identical generic response for both existing and non-existing emails, without leaking tokens."""
    client.post("/api/v1/auth/register", json=unique_user_payload)
    
    # Registered email
    resp1 = client.post("/api/v1/auth/forgot-password", json={"email": unique_user_payload["email"]})
    assert resp1.status_code == 200
    assert "reset link" not in resp1.json()  # MUST NOT leak reset link/token
    assert "sent" in resp1.json()["message"].lower()

    # Non-registered email
    resp2 = client.post("/api/v1/auth/forgot-password", json={"email": "nobody@studenthub.dev"})
    assert resp2.status_code == 200
    assert "reset link" not in resp2.json()
    assert resp1.json()["message"] == resp2.json()["message"]


def test_forgot_password_invalid_email():
    """Invalid email in forgot password request must be rejected."""
    response = client.post("/api/v1/auth/forgot-password", json={"email": "invalid-email"})
    assert response.status_code == 422


def test_reset_password_end_to_end_flow(unique_user_payload):
    """
    Complete flow:
    1. Register user
    2. Create reset token directly in DB
    3. Reset password with new complex password
    4. Old password fails
    5. New password succeeds
    6. Reusing same token fails (single-use)
    """
    client.post("/api/v1/auth/register", json=unique_user_payload)
    old_pw = unique_user_payload["password"]
    new_pw = "BrandNew@Password456!"

    with TestingSessionLocal() as db:
        user = db.query(User).filter(User.email == unique_user_payload["email"]).first()
        assert user is not None
        user.password_reset_token = "valid-test-reset-token-12345"
        user.password_reset_token_expires = datetime.now(timezone.utc) + timedelta(minutes=30)
        db.commit()

    # 3. Call reset-password API
    reset_resp = client.post("/api/v1/auth/reset-password", json={
        "token": "valid-test-reset-token-12345",
        "new_password": new_pw
    })
    assert reset_resp.status_code == 200
    assert "updated" in reset_resp.json()["message"].lower()

    # 4. Old password must fail
    login_old = client.post("/api/v1/auth/login", json={
        "email": unique_user_payload["email"],
        "password": old_pw
    })
    assert login_old.status_code == 401

    # 5. New password must succeed
    login_new = client.post("/api/v1/auth/login", json={
        "email": unique_user_payload["email"],
        "password": new_pw
    })
    assert login_new.status_code == 200
    assert "access_token" in login_new.json()

    # 6. Reusing the token must fail (single-use)
    reuse_resp = client.post("/api/v1/auth/reset-password", json={
        "token": "valid-test-reset-token-12345",
        "new_password": "Another@NewPass999!"
    })
    assert reuse_resp.status_code == 400


def test_reset_password_expired_token(unique_user_payload):
    """Expired reset token must be rejected with 400."""
    client.post("/api/v1/auth/register", json=unique_user_payload)

    with TestingSessionLocal() as db:
        user = db.query(User).filter(User.email == unique_user_payload["email"]).first()
        user.password_reset_token = "expired-token-999"
        # Set expiry in the past
        user.password_reset_token_expires = datetime.now(timezone.utc) - timedelta(minutes=10)
        db.commit()

    resp = client.post("/api/v1/auth/reset-password", json={
        "token": "expired-token-999",
        "new_password": "Valid@Password789!"
    })
    assert resp.status_code == 400
    assert "invalid or has expired" in resp.json()["detail"].lower()


def test_reset_password_weak_password_rejected():
    """Resetting password with weak password must be rejected at schema level."""
    resp = client.post("/api/v1/auth/reset-password", json={
        "token": "some-token",
        "new_password": "weak"
    })
    assert resp.status_code == 422


# ══════════════════════════════════════════════════════════════════════════════
# 5. AUTHORIZATION & DATA ISOLATION (USER OWNERSHIP) TESTS
# ══════════════════════════════════════════════════════════════════════════════

def test_user_cannot_access_or_modify_other_user_notes():
    """User A must not be able to read, update, or delete User B's private notes."""
    # Register User A
    user_a = client.post("/api/v1/auth/register", json={
        "name": generate_alpha_username("UserAlpha"),
        "email": f"alpha_{uuid.uuid4().hex[:6]}@studenthub.dev",
        "password": "Alpha@Password123!"
    }).json()
    token_a = user_a["access_token"]

    # Register User B
    user_b = client.post("/api/v1/auth/register", json={
        "name": generate_alpha_username("UserBeta"),
        "email": f"beta_{uuid.uuid4().hex[:6]}@studenthub.dev",
        "password": "Beta@Password123!"
    }).json()
    token_b = user_b["access_token"]

    # User A creates a note
    note_a = client.post("/api/v1/notes", json={
        "title": "Alpha Private Note",
        "content": "Confidential study material of Alpha"
    }, headers={"Authorization": f"Bearer {token_a}"}).json()
    note_id = note_a["id"]

    # User B tries to GET User A's note
    get_resp = client.get(f"/api/v1/notes/{note_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert get_resp.status_code in [403, 404]

    # User B tries to UPDATE User A's note
    put_resp = client.put(f"/api/v1/notes/{note_id}", json={
        "title": "Hacked Title",
        "content": "Compromised content"
    }, headers={"Authorization": f"Bearer {token_b}"})
    assert put_resp.status_code in [403, 404]

    # User B tries to DELETE User A's note
    del_resp = client.delete(f"/api/v1/notes/{note_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert del_resp.status_code in [403, 404]


def test_user_profile_update_validation():
    """Profile update via PUT /me must validate username (letters only) and password complexity."""
    reg = client.post("/api/v1/auth/register", json={
        "name": generate_alpha_username("OriginalName"),
        "email": f"prof_{uuid.uuid4().hex[:6]}@studenthub.dev",
        "password": "Original@Password123!"
    }).json()
    token = reg["access_token"]

    # Updating with valid alphabetic name
    valid_upd = client.put("/api/v1/auth/me", json={"name": "NewAlphaName"}, headers={"Authorization": f"Bearer {token}"})
    assert valid_upd.status_code == 200
    assert valid_upd.json()["name"] == "NewAlphaName"

    # Updating with invalid username (numbers/spaces)
    invalid_upd = client.put("/api/v1/auth/me", json={"name": "Invalid123"}, headers={"Authorization": f"Bearer {token}"})
    assert invalid_upd.status_code == 422

    # Updating with weak password
    weak_pw_upd = client.put("/api/v1/auth/me", json={"password": "weak"}, headers={"Authorization": f"Bearer {token}"})
    assert weak_pw_upd.status_code == 422
