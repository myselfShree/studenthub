import pytest
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

import app.models  # ensure models are imported before metadata creation
from app.core.database import Base, get_db
from app.main import app as fastapi_app

# Use in-memory SQLite with StaticPool for fast, isolated test execution
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

fastapi_app.dependency_overrides[get_db] = override_get_db


def make_alphabetic_name(prefix="User") -> str:
    """Generate alphabets-only username compliant with strict schema rules."""
    alpha = "".join([c for c in uuid.uuid4().hex if c.isalpha()])[:6]
    return f"{prefix}{alpha.capitalize()}"


def create_test_user_token(client: TestClient, name_prefix="TestUser"):
    """Helper to create an authenticated user with valid alphabetic username and complex password."""
    name = make_alphabetic_name(name_prefix)
    suffix = uuid.uuid4().hex[:6]
    payload = {
        "name": name,
        "email": f"{name_prefix.lower()}_{suffix}@studenthub.dev",
        "password": "Password123!"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201, f"Failed to register test user: {response.text}"
    return response.json()["access_token"], name
