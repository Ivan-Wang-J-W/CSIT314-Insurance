"""
Tests for ComplianceController.
Covers: CO-01 (fraud reports), CO-05 (escalate), CO-09 (identity status).
"""

import pytest
from control.compliance_controller import (
    get_fraud_reports, submit_fraud_report, review_fraud_report,
    escalate_campaign, view_identity_status,
)
from control.assessor_controller import verify_identity
import data.store as store
from tests.conftest import make_campaign


@pytest.fixture
def fr(fundraiser_user):
    return fundraiser_user


@pytest.fixture
def donee(donee_user):
    return donee_user


@pytest.fixture
def compliance(compliance_user):
    return compliance_user


@pytest.fixture
def assessor(assessor_user):
    return assessor_user


@pytest.fixture
def active_campaign(fr):
    return make_campaign(fr["id"], status="ACTIVE")


class TestFraudReports:
    """CO-01: review fraud reports submitted by donees."""

    def test_submit_fraud_report(self, donee, active_campaign):
        report = submit_fraud_report(
            active_campaign["id"], donee["id"], "Fake charity"
        )
        assert report["status"] == "PENDING"
        assert report["reported_by"] == donee["id"]

    def test_submit_empty_description_raises(self, donee, active_campaign):
        with pytest.raises(ValueError, match="Description is required"):
            submit_fraud_report(active_campaign["id"], donee["id"], "")

    def test_submit_for_nonexistent_campaign_raises(self, donee):
        with pytest.raises(ValueError, match="not found"):
            submit_fraud_report("bad-id", donee["id"], "Fraud")

    def test_get_all_fraud_reports(self, donee, fr, compliance):
        c1 = make_campaign(fr["id"], status="ACTIVE")
        c2 = make_campaign(fr["id"], status="ACTIVE")
        submit_fraud_report(c1["id"], donee["id"], "Report 1")
        submit_fraud_report(c2["id"], donee["id"], "Report 2")
        reports = get_fraud_reports()
        assert len(reports) == 2

    def test_filter_fraud_reports_by_status(self, donee, fr, compliance):
        c = make_campaign(fr["id"], status="ACTIVE")
        report = submit_fraud_report(c["id"], donee["id"], "Suspicious")
        review_fraud_report(report["id"], compliance["id"])

        pending = get_fraud_reports(status="PENDING")
        reviewed = get_fraud_reports(status="REVIEWED")
        assert len(pending) == 0
        assert len(reviewed) == 1

    def test_review_fraud_report(self, donee, active_campaign, compliance):
        report = submit_fraud_report(active_campaign["id"], donee["id"], "Fake")
        reviewed = review_fraud_report(report["id"], compliance["id"])
        assert reviewed["status"] == "REVIEWED"
        assert reviewed["reviewed_by"] == compliance["id"]

    def test_review_nonexistent_report_raises(self, compliance):
        with pytest.raises(ValueError, match="not found"):
            review_fraud_report("bad-id", compliance["id"])

    def test_submit_fraud_report_via_http(self, client, donee_user,
                                          fundraiser_user, auth_headers):
        c = make_campaign(fundraiser_user["id"], status="ACTIVE")
        headers = auth_headers("donee")
        resp = client.post("/api/compliance/fraud-reports",
                           json={"campaign_id": c["id"], "description": "Fake"},
                           headers=headers)
        assert resp.status_code == 201

    def test_get_fraud_reports_requires_compliance_role(self, client, donee_user, auth_headers):
        headers = auth_headers("donee")
        resp = client.get("/api/compliance/fraud-reports", headers=headers)
        assert resp.status_code == 403


class TestEscalateCampaign:
    """CO-05: escalate high-risk campaign to senior officer."""

    def test_escalate_suspends_campaign_and_reports(self, donee, active_campaign, compliance):
        submit_fraud_report(active_campaign["id"], donee["id"], "High risk")
        result = escalate_campaign(active_campaign["id"], compliance["id"], "Needs senior review")
        assert result["reports_escalated"] == 1

        campaign = store.get_campaign_by_id(active_campaign["id"])
        assert campaign["status"] == "SUSPENDED"

    def test_escalate_nonexistent_campaign_raises(self, compliance):
        with pytest.raises(ValueError, match="not found"):
            escalate_campaign("bad-id", compliance["id"], "Notes")

    def test_escalate_via_http(self, client, compliance_user, fundraiser_user, auth_headers):
        c = make_campaign(fundraiser_user["id"], status="ACTIVE")
        headers = auth_headers("compliance")
        resp = client.post(f"/api/compliance/campaigns/{c['id']}/escalate",
                           json={"notes": "Under investigation"},
                           headers=headers)
        assert resp.status_code == 200


class TestIdentityStatus:
    """CO-09: view identity verification status of Fund Raiser."""

    def test_identity_status_pending_by_default(self, active_campaign, compliance):
        status = view_identity_status(active_campaign["id"])
        assert status["status"] == "PENDING"

    def test_identity_status_after_verification(self, active_campaign, assessor, compliance):
        verify_identity(active_campaign["id"], assessor["id"], ["doc.pdf"])
        status = view_identity_status(active_campaign["id"])
        assert status["status"] == "VERIFIED"

    def test_identity_status_via_http(self, client, compliance_user,
                                       fundraiser_user, assessor_user, auth_headers):
        c = make_campaign(fundraiser_user["id"], status="ACTIVE")
        verify_identity(c["id"], assessor_user["id"], [])
        headers = auth_headers("compliance")
        resp = client.get(f"/api/compliance/campaigns/{c['id']}/identity-status",
                          headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "VERIFIED"
