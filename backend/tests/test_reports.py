"""
Tests for ReportController.
Covers: PM-08 (daily report), SA-07 (system metrics).
"""

import pytest
from datetime import date
from control.report_controller import daily_report, system_metrics
from control.donation_controller import create_donation
from tests.conftest import make_campaign, _make_user


@pytest.fixture
def fr(fundraiser_user):
    return fundraiser_user


@pytest.fixture
def donee(donee_user):
    return donee_user


class TestDailyReport:
    """PM-08: generate daily reports of fundraising activity."""

    def test_daily_report_structure(self, fr):
        report = daily_report()
        required_keys = {
            "date", "new_campaigns", "donations_count",
            "total_donated", "approved_campaigns",
            "rejected_campaigns", "suspended_campaigns", "campaign_summary",
        }
        assert required_keys.issubset(report.keys())

    def test_daily_report_counts_todays_campaigns(self, fr):
        make_campaign(fr["id"], status="ACTIVE")
        make_campaign(fr["id"], status="PENDING")
        report = daily_report()
        assert report["new_campaigns"] == 2

    def test_daily_report_counts_todays_donations(self, fr, donee):
        c = make_campaign(fr["id"], status="ACTIVE", goal_amount=5000.0)
        create_donation(c["id"], donee["id"], 100.0)
        create_donation(c["id"], donee["id"], 200.0)
        report = daily_report()
        assert report["donations_count"] == 2
        assert report["total_donated"] == 300.0

    def test_daily_report_defaults_to_today(self, fr):
        report = daily_report()
        assert report["date"] == date.today().isoformat()

    def test_daily_report_accepts_custom_date(self, fr):
        report = daily_report("2024-01-15")
        assert report["date"] == "2024-01-15"
        assert report["new_campaigns"] == 0  # nothing created on that date

    def test_daily_report_via_http(self, client, platform_manager_user, auth_headers):
        headers = auth_headers("pm")
        resp = client.get("/api/reports/daily", headers=headers)
        assert resp.status_code == 200
        assert "date" in resp.get_json()

    def test_daily_report_forbidden_for_donee(self, client, donee_user, auth_headers):
        headers = auth_headers("donee")
        resp = client.get("/api/reports/daily", headers=headers)
        assert resp.status_code == 403


class TestSystemMetrics:
    """SA-07: monitor system performance metrics."""

    def test_metrics_structure(self):
        metrics = system_metrics()
        required_keys = {
            "total_users", "users_by_role", "total_campaigns",
            "active_campaigns", "completed_campaigns",
            "total_donations", "total_raised", "average_donation",
        }
        assert required_keys.issubset(metrics.keys())

    def test_metrics_counts_users_correctly(self, fr, donee_user):
        metrics = system_metrics()
        assert metrics["total_users"] == 2
        assert metrics["users_by_role"].get("FUNDRAISER") == 1
        assert metrics["users_by_role"].get("DONEE") == 1

    def test_metrics_counts_campaigns(self, fr):
        make_campaign(fr["id"], status="ACTIVE")
        make_campaign(fr["id"], status="ACTIVE")
        make_campaign(fr["id"], status="COMPLETED")
        metrics = system_metrics()
        assert metrics["total_campaigns"] == 3
        assert metrics["active_campaigns"] == 2
        assert metrics["completed_campaigns"] == 1

    def test_metrics_calculates_average_donation(self, fr, donee_user):
        c = make_campaign(fr["id"], status="ACTIVE", goal_amount=5000.0)
        create_donation(c["id"], donee_user["id"], 100.0)
        create_donation(c["id"], donee_user["id"], 300.0)
        metrics = system_metrics()
        assert metrics["total_raised"] == 400.0
        assert metrics["average_donation"] == 200.0

    def test_metrics_via_http(self, client, admin_user, auth_headers):
        headers = auth_headers("admin")
        resp = client.get("/api/reports/metrics", headers=headers)
        assert resp.status_code == 200

    def test_metrics_accessible_for_platform_manager(self, client, platform_manager_user, auth_headers):
        headers = auth_headers("pm")
        resp = client.get("/api/reports/metrics", headers=headers)
        assert resp.status_code == 200
