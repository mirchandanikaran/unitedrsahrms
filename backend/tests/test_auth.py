"""API tests for authentication."""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_login_invalid():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "invalid@test.com", "password": "wrong"},
    )
    assert response.status_code == 401


def test_login_missing_fields():
    response = client.post("/api/v1/auth/login", json={})
    assert response.status_code == 422
