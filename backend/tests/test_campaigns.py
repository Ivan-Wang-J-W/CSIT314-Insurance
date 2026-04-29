"""
Tests for CampaignController and MilestoneController.
Covers: G-01, D-01, FR-02, FR-04, FR-07, D-08, PM-03, PM-10.
"""

import pytest
from control.campaign_controller import (
    list_campaigns, get_campaign, create_campaign, update_campaign,
    delete_campaign, approve_campaign, reject_campaign, suspend_campaign,
    get_campaign_progress, search_campaign_history,
)
from control.milestone_controller import post_milestone, get_milestones
from tests.conftest import make_campaign, _make_user


@pytest.fixture
def fr(fundraiser_user):
    return fundraiser_user


@pytest.fixture
def pm(platform_manager_user):
    return platform_manager_user


@pytest.fixture
def active_campaign(fr):
    return make_campaign(fr["id"], status="ACTIVE", urgency_tier="HIGH")


class TestListCampaigns:
    """G-01: browse campaigns without login."""

    def test_returns_only_active_by_default(self, fr):
        make_campaign(fr["id"], status="ACTIVE")
        make_campaign(fr["id"], status="PENDING")
        campaigns = list_campaigns()
        assert all(c["status"] == "ACTIVE" for c in campaigns)
        assert len(campaigns) == 1

    def test_filter_by_urgency_tier(self, fr):
        """D-01: filter campaigns by urgency tier."""
        make_campaign(fr["id"], status="ACTIVE", urgency_tier="CRITICAL")
        make_campaign(fr["id"], status="ACTIVE", urgency_tier="LOW")
        results = list_campaigns(urgency_tier="CRITICAL")
        assert len(results) == 1
        assert results[0]["urgency_tier"] == "CRITICAL"

    def test_filter_by_keyword(self, fr):
        make_campaign(fr["id"], status="ACTIVE", title="Heart Surgery Fund")
        make_campaign(fr["id"], status="ACTIVE", title="School Supplies")
        results = list_campaigns(keyword="surgery")
        assert len(results) == 1

    def test_filter_by_category(self, fr):
        make_campaign(fr["id"], status="ACTIVE", category="Medical")
        make_campaign(fr["id"], status="ACTIVE", category="Education")
        results = list_campaigns(category="Medical")
        assert len(results) == 1
        assert results[0]["category"] == "Medical"


class TestCreateCampaign:
    """FR-02: upload images and detailed descriptions for campaign."""

    def test_create_success(self, fr):
        campaign = create_campaign({
            "title": "My Campaign",
            "description": "A very detailed description of the campaign.",
            "category": "Medical",
            "goal_amount": 5000,
            "image_url": "https://example.com/pic.jpg",
            "start_date": "2025-01-01",
            "end_date": "2025-12-31",
            "urgency_tier": "HIGH",
        }, fr["id"])
        assert campaign["title"] == "My Campaign"
        assert campaign["status"] == "PENDING"
        assert campaign["fundraiser_id"] == fr["id"]
        assert campaign["image_url"] == "https://example.com/pic.jpg"

    def test_create_missing_required_fields(self, fr):
        with pytest.raises(ValueError, match="required"):
            create_campaign({"title": "Only title"}, fr["id"])

    def test_create_invalid_goal(self, fr):
        with pytest.raises(ValueError, match="positive"):
            create_campaign({
                "title": "T", "description": "D", "category": "C",
                "goal_amount": -100,
            }, fr["id"])

    def test_create_invalid_urgency_tier(self, fr):
        with pytest.raises(ValueError, match="urgency_tier"):
            create_campaign({
                "title": "T", "description": "D", "category": "C",
                "goal_amount": 100, "urgency_tier": "EXTREME",
            }, fr["id"])


class TestCampaignProgress:
    """FR-04: track real-time donation progress."""

    def test_progress_correct(self, fr):
        c = make_campaign(fr["id"], goal_amount=1000.0, raised_amount=450.0, status="ACTIVE")
        progress = get_campaign_progress(c["id"])
        assert progress["progress_percent"] == 45.0
        assert progress["raised_amount"] == 450.0
        assert progress["goal_amount"] == 1000.0

    def test_progress_100_when_goal_reached(self, fr):
        c = make_campaign(fr["id"], goal_amount=500.0, raised_amount=500.0, status="ACTIVE")
        progress = get_campaign_progress(c["id"])
        assert progress["progress_percent"] == 100.0

    def test_progress_not_found(self):
        with pytest.raises(ValueError, match="not found"):
            get_campaign_progress("nonexistent")


class TestApproveRejectCampaign:
    """PM-03: reject a fundraising activity with remarks."""

    def test_approve_pending_campaign(self, fr, pm):
        c = make_campaign(fr["id"], status="PENDING")
        approved = approve_campaign(c["id"], pm["id"])
        assert approved["status"] == "ACTIVE"

    def test_approve_non_pending_raises(self, fr, pm):
        c = make_campaign(fr["id"], status="ACTIVE")
        with pytest.raises(ValueError, match="PENDING"):
            approve_campaign(c["id"], pm["id"])

    def test_reject_with_remarks(self, fr, pm):
        c = make_campaign(fr["id"], status="PENDING")
        rejected = reject_campaign(c["id"], pm["id"], "Insufficient documentation")
        assert rejected["status"] == "REJECTED"
        assert rejected["rejection_remarks"] == "Insufficient documentation"

    def test_reject_without_remarks_raises(self, fr, pm):
        c = make_campaign(fr["id"], status="PENDING")
        with pytest.raises(ValueError, match="remarks are required"):
            reject_campaign(c["id"], pm["id"], "")


class TestCampaignHistory:
    """PM-10: search history of approved/rejected/suspended campaigns."""

    def test_search_by_status(self, fr):
        make_campaign(fr["id"], status="ACTIVE")
        make_campaign(fr["id"], status="REJECTED")
        make_campaign(fr["id"], status="SUSPENDED")
        results = search_campaign_history(status_list=["REJECTED", "SUSPENDED"])
        statuses = {c["status"] for c in results}
        assert statuses == {"REJECTED", "SUSPENDED"}

    def test_search_by_keyword(self, fr):
        make_campaign(fr["id"], status="REJECTED", title="Charity Marathon")
        make_campaign(fr["id"], status="REJECTED", title="Medical Aid Fund")
        results = search_campaign_history(
            status_list=["REJECTED"], keyword="marathon"
        )
        assert len(results) == 1
        assert "Marathon" in results[0]["title"]


class TestMilestones:
    """FR-07: post milestone updates. D-08: view milestone feed."""

    def test_post_milestone_success(self, fr, active_campaign):
        m = post_milestone(
            campaign_id=active_campaign["id"],
            fundraiser_id=fr["id"],
            title="Reached 50% goal",
            description="We are halfway there!",
        )
        assert m["title"] == "Reached 50% goal"
        assert m["campaign_id"] == active_campaign["id"]

    def test_post_milestone_wrong_fundraiser(self, active_campaign):
        other_fr = _make_user("other_fr", "FUNDRAISER")
        with pytest.raises(ValueError, match="Not authorised"):
            post_milestone(active_campaign["id"], other_fr["id"], "Update")

    def test_get_milestones_feed(self, fr, active_campaign):
        """D-08: live milestone feed."""
        post_milestone(active_campaign["id"], fr["id"], "First update")
        post_milestone(active_campaign["id"], fr["id"], "Second update")
        feed = get_milestones(active_campaign["id"])
        assert len(feed) == 2
        # newest first
        assert feed[0]["title"] == "Second update"

    def test_post_milestone_empty_title_raises(self, fr, active_campaign):
        with pytest.raises(ValueError, match="title is required"):
            post_milestone(active_campaign["id"], fr["id"], "")


class TestCampaignRoutes:
    """HTTP smoke tests for campaign boundary layer."""

    def test_list_campaigns_public(self, client, fundraiser_user):
        make_campaign(fundraiser_user["id"], status="ACTIVE")
        resp = client.get("/api/campaigns/")
        assert resp.status_code == 200
        assert "campaigns" in resp.get_json()

    def test_filter_by_urgency_tier_via_http(self, client, fundraiser_user):
        """D-01 via HTTP."""
        make_campaign(fundraiser_user["id"], status="ACTIVE", urgency_tier="CRITICAL")
        make_campaign(fundraiser_user["id"], status="ACTIVE", urgency_tier="LOW")
        resp = client.get("/api/campaigns/?urgency_tier=CRITICAL")
        data = resp.get_json()
        assert len(data["campaigns"]) == 1

    def test_create_campaign_requires_fundraiser_role(self, client, donee_user, auth_headers):
        headers = auth_headers("donee")
        resp = client.post("/api/campaigns/", json={
            "title": "T", "description": "D", "category": "C", "goal_amount": 100
        }, headers=headers)
        assert resp.status_code == 403

    def test_reject_campaign_via_http(self, client, fundraiser_user,
                                      platform_manager_user, auth_headers):
        c = make_campaign(fundraiser_user["id"], status="PENDING")
        headers = auth_headers("pm")
        resp = client.post(f"/api/campaigns/{c['id']}/reject",
                           json={"remarks": "Incomplete info"}, headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()["campaign"]["status"] == "REJECTED"
