"""
Tests for DonationController.
Covers: donation creation, history, D-03 (goal alerts), D-08 (milestone feed via donations).
"""

import pytest
from control.donation_controller import (
    create_donation, get_donation_history, get_goal_alerts, toggle_favorite,
)
from control.notification_controller import get_notifications
from tests.conftest import make_campaign, _make_user
import data.store as store


@pytest.fixture
def fr(fundraiser_user):
    return fundraiser_user


@pytest.fixture
def donee(donee_user):
    return donee_user


@pytest.fixture
def active_campaign(fr):
    return make_campaign(fr["id"], status="ACTIVE", goal_amount=1000.0, raised_amount=0.0)


class TestCreateDonation:
    def test_successful_donation(self, donee, active_campaign):
        donation = create_donation(active_campaign["id"], donee["id"], 100.0, "Good luck!")
        assert donation["amount"] == 100.0
        assert donation["donee_id"] == donee["id"]

        updated = store.get_campaign_by_id(active_campaign["id"])
        assert updated["raised_amount"] == 100.0

    def test_zero_amount_raises(self, donee, active_campaign):
        with pytest.raises(ValueError, match="positive"):
            create_donation(active_campaign["id"], donee["id"], 0)

    def test_negative_amount_raises(self, donee, active_campaign):
        with pytest.raises(ValueError, match="positive"):
            create_donation(active_campaign["id"], donee["id"], -50)

    def test_campaign_not_found_raises(self, donee):
        with pytest.raises(ValueError, match="not found"):
            create_donation("nonexistent", donee["id"], 100)

    def test_donation_to_inactive_campaign_raises(self, fr, donee):
        pending = make_campaign(fr["id"], status="PENDING")
        with pytest.raises(ValueError, match="not active"):
            create_donation(pending["id"], donee["id"], 50)

    def test_campaign_auto_completes_on_goal_reached(self, donee, active_campaign):
        create_donation(active_campaign["id"], donee["id"], 1000.0)
        updated = store.get_campaign_by_id(active_campaign["id"])
        assert updated["status"] == "COMPLETED"


class TestGoalAlerts:
    """D-03: receive alert when saved campaign is within 10% of goal."""

    def test_alert_triggered_when_within_10_percent(self, donee, active_campaign):
        # Save the campaign first
        toggle_favorite(donee["id"], active_campaign["id"])
        # Donate 91% of goal — crosses the 90% threshold
        create_donation(active_campaign["id"], donee["id"], 910.0)

        alerts = get_goal_alerts(donee["id"])
        assert len(alerts) == 1
        assert "within 10%" in alerts[0]["alert_message"]

    def test_no_alert_when_far_from_goal(self, donee, active_campaign):
        toggle_favorite(donee["id"], active_campaign["id"])
        create_donation(active_campaign["id"], donee["id"], 100.0)  # only 10%
        alerts = get_goal_alerts(donee["id"])
        assert len(alerts) == 0

    def test_alert_only_for_saved_campaigns(self, donee, fr):
        unsaved = make_campaign(fr["id"], status="ACTIVE", goal_amount=100.0)
        create_donation(unsaved["id"], donee["id"], 95.0)  # 95% — near goal
        alerts = get_goal_alerts(donee["id"])
        assert len(alerts) == 0  # not saved so no alert

    def test_in_app_notification_sent_to_saver(self, donee, active_campaign):
        toggle_favorite(donee["id"], active_campaign["id"])
        create_donation(active_campaign["id"], donee["id"], 910.0)
        notifs = get_notifications(donee["id"])
        assert any("10%" in n["message"] for n in notifs)

    def test_get_goal_alerts_via_http(self, client, donee_user, fundraiser_user, auth_headers):
        c = make_campaign(fundraiser_user["id"], status="ACTIVE", goal_amount=100.0)
        toggle_favorite(donee_user["id"], c["id"])
        create_donation(c["id"], donee_user["id"], 92.0)
        headers = auth_headers("donee")
        resp = client.get("/api/donations/alerts", headers=headers)
        assert resp.status_code == 200
        assert len(resp.get_json()["alerts"]) == 1


class TestDonationHistory:
    def test_history_returns_donee_donations_only(self, donee, fr):
        c1 = make_campaign(fr["id"], status="ACTIVE")
        c2 = make_campaign(fr["id"], status="ACTIVE")
        create_donation(c1["id"], donee["id"], 50)
        create_donation(c2["id"], donee["id"], 75)

        other = _make_user("other_donee", "DONEE")
        create_donation(c1["id"], other["id"], 200)

        history = get_donation_history(donee["id"])
        assert len(history) == 2
        assert all(d["donee_id"] == donee["id"] for d in history)

    def test_history_filtered_by_category(self, donee, fr):
        med = make_campaign(fr["id"], status="ACTIVE", category="Medical")
        edu = make_campaign(fr["id"], status="ACTIVE", category="Education")
        create_donation(med["id"], donee["id"], 50)
        create_donation(edu["id"], donee["id"], 75)

        history = get_donation_history(donee["id"], category="Medical")
        assert len(history) == 1
        assert history[0]["campaign_id"] == med["id"]


class TestToggleFavorite:
    def test_save_campaign(self, donee, active_campaign):
        result = toggle_favorite(donee["id"], active_campaign["id"])
        assert result["saved"] is True

    def test_unsave_campaign(self, donee, active_campaign):
        toggle_favorite(donee["id"], active_campaign["id"])
        result = toggle_favorite(donee["id"], active_campaign["id"])
        assert result["saved"] is False
