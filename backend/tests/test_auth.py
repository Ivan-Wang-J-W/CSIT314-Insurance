"""
Tests for AuthController — covers G-07 (register) and G-09 (login/logout).
"""

import pytest
from control.auth_controller import register, login, logout, get_current_user


class TestRegister:
    """G-07: register as a Donee."""

    def test_register_donee_success(self):
        user = register({
            "username": "newuser",
            "email": "new@test.com",
            "password": "pass123",
            "role": "DONEE",
            "full_name": "New User",
        })
        assert user["username"] == "newuser"
        assert user["role"] == "DONEE"
        assert user["status"] == "ACTIVE"
        assert "password_hash" not in user

    def test_register_fundraiser_success(self):
        user = register({
            "username": "fr1",
            "email": "fr1@test.com",
            "password": "pass123",
            "role": "FUNDRAISER",
            "full_name": "Fund Raiser",
        })
        assert user["role"] == "FUNDRAISER"

    def test_register_missing_required_fields(self):
        with pytest.raises(ValueError, match="required"):
            register({"username": "x"})

    def test_register_duplicate_username(self):
        data = {"username": "dup", "email": "dup@test.com",
                "password": "pass", "role": "DONEE", "full_name": "Dup"}
        register(data)
        with pytest.raises(ValueError, match="Username already taken"):
            register({**data, "email": "other@test.com"})

    def test_register_duplicate_email(self):
        data = {"username": "u1", "email": "same@test.com",
                "password": "pass", "role": "DONEE", "full_name": "U1"}
        register(data)
        with pytest.raises(ValueError, match="Email already registered"):
            register({**data, "username": "u2"})

    def test_register_invalid_role(self):
        with pytest.raises(ValueError, match="Invalid role"):
            register({
                "username": "u", "email": "u@test.com",
                "password": "p", "role": "SUPERUSER", "full_name": "U",
            })


class TestLogin:
    """G-09: log in to existing account."""

    def setup_method(self):
        register({
            "username": "loginuser",
            "email": "login@test.com",
            "password": "correct_pass",
            "role": "DONEE",
            "full_name": "Login User",
        })

    def test_login_success_returns_token_and_user(self):
        token, user = login("loginuser", "correct_pass")
        assert token is not None
        assert len(token) > 10
        assert user["username"] == "loginuser"
        assert "password_hash" not in user

    def test_login_wrong_password(self):
        with pytest.raises(ValueError, match="Invalid credentials"):
            login("loginuser", "wrong_pass")

    def test_login_nonexistent_user(self):
        with pytest.raises(ValueError, match="Invalid credentials"):
            login("nobody", "pass")

    def test_login_suspended_account(self):
        import data.store as store
        u = store.get_user_by_username("loginuser")
        store.update_user(u["id"], {"status": "SUSPENDED"})
        with pytest.raises(ValueError, match="suspended"):
            login("loginuser", "correct_pass")


class TestLogout:
    def test_logout_invalidates_token(self):
        register({
            "username": "logoutuser",
            "email": "lo@test.com",
            "password": "pass",
            "role": "DONEE",
            "full_name": "Logout User",
        })
        token, _ = login("logoutuser", "pass")
        assert get_current_user(token) is not None

        logout(token)
        assert get_current_user(token) is None

    def test_logout_with_invalid_token_does_not_raise(self):
        logout("invalid-token-xyz")


class TestAuthRoutes:
    """HTTP-level smoke tests for auth endpoints."""

    def test_register_endpoint(self, client):
        resp = client.post("/api/auth/register", json={
            "username": "webuser",
            "email": "web@test.com",
            "password": "pass",
            "role": "DONEE",
            "full_name": "Web User",
        })
        assert resp.status_code == 201
        assert "user" in resp.get_json()

    def test_login_endpoint(self, client):
        client.post("/api/auth/register", json={
            "username": "weblogin",
            "email": "wl@test.com",
            "password": "pass",
            "role": "DONEE",
            "full_name": "Web Login",
        })
        resp = client.post("/api/auth/login", json={
            "username": "weblogin",
            "password": "pass",
        })
        assert resp.status_code == 200
        assert "token" in resp.get_json()

    def test_me_endpoint_requires_auth(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401
