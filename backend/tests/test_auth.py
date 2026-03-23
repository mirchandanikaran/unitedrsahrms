"""API tests for authentication."""
import pytest
from fastapi.testclient import TestClient

from app.core.security import get_password_hash
from app.db.database import SessionLocal, init_db
from app.main import app
from app.models.user import RoleEnum, User


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def _ensure_login_test_user():
    """Stable user for successful login regression (bcrypt / DB / JWT)."""
    init_db()
    db = SessionLocal()
    try:
        email = "pytest_login_ok@example.com"
        if db.query(User).filter(User.email == email).first() is None:
            db.add(
                User(
                    email=email,
                    hashed_password=get_password_hash("pytest-secret"),
                    role=RoleEnum.EMPLOYEE,
                )
            )
            db.commit()
    finally:
        db.close()
    yield


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_login_invalid(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "invalid@test.com", "password": "wrong"},
    )
    assert response.status_code == 401


def test_login_missing_fields(client):
    response = client.post("/api/v1/auth/login", json={})
    assert response.status_code == 422


def test_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "pytest_login_ok@example.com", "password": "pytest-secret"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data.get("token_type") == "bearer"
    assert "access_token" in data
    assert data.get("user", {}).get("email") == "pytest_login_ok@example.com"
