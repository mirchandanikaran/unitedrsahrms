"""API tests for authentication."""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


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
