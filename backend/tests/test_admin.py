"""
Tests: UserController, ConfigController
User Stories: SA-01, SA-09
Editor: BeiRui
"""

import pytest
from control.user_controller import (
    create_user, list_users, get_user, update_user, toggle_status, delete_user, get_stats,
)
from control.config_controller import get_config, update_config


class TestCreateUser:
    """SA-01: create new user accounts (FR, Donees, Platform Managers)."""

    def test_create_fundraiser(self):
        user = create_user({
            "username": "fr_new",
            "email": "fr@test.com",
            "password": "pass",
            "role": "FUNDRAISER",
            "full_name": "New Fundraiser",
        })
        assert user["role"] == "FUNDRAISER"
        assert user["status"] == "ACTIVE"
        assert "password_hash" not in user

    def test_create_platform_manager(self):
        user = create_user({
            "username": "pm_new",
            "email": "pm@test.com",
            "password": "pass",
            "role": "PLATFORM_MANAGER",
            "full_name": "New PM",
        })
        assert user["role"] == "PLATFORM_MANAGER"

    def test_create_donee(self):
        user = create_user({
            "username": "dn_new",
            "email": "dn@test.com",
            "password": "pass",
            "role": "DONEE",
            "full_name": "New Donee",
        })
        assert user["role"] == "DONEE"

    def test_create_duplicate_username_raises(self):
        create_user({
            "username": "dup_user",
            "email": "dup@test.com",
            "password": "pass",
            "role": "DONEE",
            "full_name": "Dup User",
        })
        with pytest.raises(ValueError, match="Username already taken"):
            create_user({
                "username": "dup_user",
                "email": "other@test.com",
                "password": "pass",
                "role": "DONEE",
                "full_name": "Dup User",
            })

    def test_create_invalid_role_raises(self):
        with pytest.raises(ValueError, match="Invalid role"):
            create_user({
                "username": "u", "email": "u@test.com",
                "password": "p", "role": "SUPERADMIN", "full_name": "U",
            })

    def test_create_user_via_http(self, client, admin_user, auth_headers):
        headers = auth_headers("admin")
        resp = client.post("/api/admin/users/", json={
            "username": "newuser",
            "email": "newuser@test.com",
            "password": "pass",
            "role": "DONEE",
            "full_name": "New User",
        }, headers=headers)
        assert resp.status_code == 201

    def test_create_user_forbidden_without_admin_role(self, client, donee_user, auth_headers):
        headers = auth_headers("donee")
        resp = client.post("/api/admin/users/", json={
            "username": "u", "email": "u@test.com",
            "password": "p", "role": "DONEE", "full_name": "U",
        }, headers=headers)
        assert resp.status_code == 403


class TestUserManagement:
    def test_list_users(self, fundraiser_user, donee_user):
        users = list_users()
        assert len(users) == 2

    def test_list_users_filter_by_role(self, fundraiser_user, donee_user):
        fundraisers = list_users(role="FUNDRAISER")
        assert len(fundraisers) == 1
        assert fundraisers[0]["role"] == "FUNDRAISER"

    def test_toggle_status_suspends_active_user(self, donee_user):
        updated = toggle_status(donee_user["id"])
        assert updated["status"] == "SUSPENDED"

    def test_toggle_status_reactivates_suspended_user(self, donee_user):
        toggle_status(donee_user["id"])
        updated = toggle_status(donee_user["id"])
        assert updated["status"] == "ACTIVE"

    def test_delete_user(self, donee_user):
        delete_user(donee_user["id"])
        with pytest.raises(ValueError, match="not found"):
            get_user(donee_user["id"])

    def test_get_stats(self, fundraiser_user, donee_user, admin_user):
        stats = get_stats()
        assert stats["total"] == 3
        assert stats["by_role"]["FUNDRAISER"] == 1
        assert stats["by_role"]["DONEE"] == 1
        assert stats["active"] == 3


class TestConfig:
    """SA-09: manage platform configuration settings."""

    def test_get_config_returns_defaults(self):
        config = get_config()
        assert "max_campaign_goal" in config
        assert "platform_fee_percent" in config

    def test_update_valid_config_key(self):
        updated = update_config("platform_fee_percent", 10)
        assert updated["platform_fee_percent"] == 10.0

    def test_update_invalid_config_key_raises(self):
        with pytest.raises(ValueError, match="Unknown config key"):
            update_config("unknown_key", 5)

    def test_update_non_numeric_value_raises(self):
        with pytest.raises(ValueError, match="must be a number"):
            update_config("platform_fee_percent", "high")

    def test_update_negative_value_raises(self):
        with pytest.raises(ValueError, match="non-negative"):
            update_config("platform_fee_percent", -1)

    def test_get_config_via_http(self, client, admin_user, auth_headers):
        headers = auth_headers("admin")
        resp = client.get("/api/admin/config", headers=headers)
        assert resp.status_code == 200
        assert "config" in resp.get_json()

    def test_update_config_via_http(self, client, admin_user, auth_headers):
        headers = auth_headers("admin")
        resp = client.put("/api/admin/config/platform_fee_percent",
                          json={"value": 8}, headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()["config"]["platform_fee_percent"] == 8.0

    def test_config_requires_admin_role(self, client, donee_user, auth_headers):
        headers = auth_headers("donee")
        resp = client.get("/api/admin/config", headers=headers)
        assert resp.status_code == 403
