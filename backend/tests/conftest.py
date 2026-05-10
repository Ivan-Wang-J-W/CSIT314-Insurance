"""Shared test fixtures — app client, store reset, and pre-built users."""

import pytest
from werkzeug.security import generate_password_hash

from app import create_app
from data.store import reset_store
import data.store as store


@pytest.fixture(autouse=True)
def clean_store():
    """Reset in-memory store before and after every test."""
    reset_store()
    yield
    reset_store()


@pytest.fixture
def app():
    application = create_app()
    application.config["TESTING"] = True
    return application


@pytest.fixture
def client(app):
    return app.test_client()


# ---------------------------------------------------------------------------
# User fixtures — insert directly into store (no HTTP round-trip needed)
# ---------------------------------------------------------------------------

def _make_user(username, role, password="password"):
    return store.create_user({
        "username": username,
        "email": f"{username}@test.com",
        "password_hash": generate_password_hash(password),
        "role": role,
        "full_name": username.capitalize(),
        "phone": "",
        "status": "ACTIVE",
    })


@pytest.fixture
def admin_user():
    return _make_user("admin", "ADMIN")


@pytest.fixture
def fundraiser_user():
    return _make_user("fundraiser", "FUNDRAISER")


@pytest.fixture
def donee_user():
    return _make_user("donee", "DONEE")


@pytest.fixture
def platform_manager_user():
    return _make_user("pm", "PLATFORM_MANAGER")


@pytest.fixture
def assessor_user():
    return _make_user("assessor", "ASSESSOR")


@pytest.fixture
def compliance_user():
    return _make_user("compliance", "COMPLIANCE")


# ---------------------------------------------------------------------------
# Auth helper — logs in a user and returns Bearer headers
# ---------------------------------------------------------------------------

@pytest.fixture
def auth_headers(client):
    """Factory: call auth_headers(username) to get {'Authorization': 'Bearer <token>'}."""
    def _get_headers(username, password="password"):
        resp = client.post("/api/auth/login", json={"username": username, "password": password})
        token = resp.get_json()["token"]
        return {"Authorization": f"Bearer {token}"}
    return _get_headers


# ---------------------------------------------------------------------------
# Campaign factory helper
# ---------------------------------------------------------------------------

def make_campaign(fundraiser_id, **overrides):
    defaults = {
        "title": "Test Campaign",
        "description": "A detailed test description",
        "category": "Medical",
        "fundraiser_id": fundraiser_id,
        "goal_amount": 1000.0,
        "raised_amount": 0.0,
        "image_url": "https://example.com/img.png",
        "start_date": "2025-01-01",
        "end_date": "2025-12-31",
        "status": "ACTIVE",
        "urgency_tier": "MEDIUM",
        "rejection_remarks": "",
        "withdrawal_held": False,
    }
    defaults.update(overrides)
    return store.create_campaign(defaults)
