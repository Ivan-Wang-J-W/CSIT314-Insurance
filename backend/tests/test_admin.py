"""
Tests: UserController, ConfigController
User Stories: SA-09
"""

import pytest
from control.user_controller import (
    toggle_status, get_stats,
)
from control.config_controller import get_config, update_config


class TestUserManagement:
    def test_toggle_status_suspends_active_user(self, donee_user):
        updated = toggle_status(donee_user["id"])
        assert updated["status"] == "SUSPENDED"

    def test_toggle_status_reactivates_suspended_user(self, donee_user):
        toggle_status(donee_user["id"])
        updated = toggle_status(donee_user["id"])
        assert updated["status"] == "ACTIVE"

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
