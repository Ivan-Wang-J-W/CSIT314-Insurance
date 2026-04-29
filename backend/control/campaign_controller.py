"""
Campaign controller — CRUD, approval workflow, urgency filtering, progress tracking.
User stories: G-01, D-01, FR-02, FR-04, PM-03, PM-10.
BCE layer: Control
"""

import data.store as store
from entity.campaign import Campaign, URGENCY_TIERS


def list_campaigns(urgency_tier: str = None, status: str = None,
                   fundraiser_id: str = None, category: str = None,
                   keyword: str = None) -> list:
    """
    G-01: public listing (defaults to ACTIVE only).
    D-01: filter by urgency_tier.
    """
    campaigns = store.get_all_campaigns()

    if status:
        statuses = status if isinstance(status, list) else [status]
        campaigns = [c for c in campaigns if c["status"] in statuses]
    else:
        campaigns = [c for c in campaigns if c["status"] == "ACTIVE"]

    if urgency_tier:
        campaigns = [c for c in campaigns if c.get("urgency_tier") == urgency_tier]

    if fundraiser_id:
        campaigns = [c for c in campaigns if c["fundraiser_id"] == fundraiser_id]

    if category:
        campaigns = [c for c in campaigns if c.get("category") == category]

    if keyword:
        kw = keyword.lower()
        campaigns = [c for c in campaigns
                     if kw in c["title"].lower() or kw in c.get("description", "").lower()]

    return [Campaign.from_dict(c).to_dict() for c in campaigns]


def get_campaign(campaign_id: str) -> dict:
    c = store.get_campaign_by_id(campaign_id)
    if not c:
        raise ValueError("Campaign not found")
    return Campaign.from_dict(c).to_dict()


def create_campaign(data: dict, fundraiser_id: str) -> dict:
    """FR-02: upload images and detailed descriptions for a campaign."""
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    category = data.get("category", "").strip()
    goal_amount = data.get("goal_amount")
    urgency_tier = data.get("urgency_tier", "LOW")

    if not title or not description or not category:
        raise ValueError("title, description, and category are required")
    if goal_amount is None or float(goal_amount) <= 0:
        raise ValueError("goal_amount must be a positive number")
    if urgency_tier not in URGENCY_TIERS:
        raise ValueError(f"urgency_tier must be one of {sorted(URGENCY_TIERS)}")

    campaign = store.create_campaign({
        "title": title,
        "description": description,
        "category": category,
        "fundraiser_id": fundraiser_id,
        "goal_amount": float(goal_amount),
        "raised_amount": 0.0,
        "image_url": data.get("image_url", ""),
        "start_date": data.get("start_date"),
        "end_date": data.get("end_date"),
        "status": "PENDING",
        "urgency_tier": urgency_tier,
        "rejection_remarks": "",
        "withdrawal_held": False,
    })
    return Campaign.from_dict(campaign).to_dict()


def update_campaign(campaign_id: str, patch: dict, fundraiser_id: str) -> dict:
    existing = store.get_campaign_by_id(campaign_id)
    if not existing:
        raise ValueError("Campaign not found")
    if existing["fundraiser_id"] != fundraiser_id:
        raise ValueError("Not authorised to edit this campaign")

    allowed = {"title", "description", "category", "goal_amount",
               "image_url", "start_date", "end_date", "urgency_tier"}
    safe_patch = {k: v for k, v in patch.items() if k in allowed}
    updated = store.update_campaign(campaign_id, safe_patch)
    return Campaign.from_dict(updated).to_dict()


def delete_campaign(campaign_id: str, fundraiser_id: str) -> None:
    existing = store.get_campaign_by_id(campaign_id)
    if not existing:
        raise ValueError("Campaign not found")
    if existing["fundraiser_id"] != fundraiser_id:
        raise ValueError("Not authorised to delete this campaign")
    store.delete_campaign(campaign_id)


def approve_campaign(campaign_id: str, reviewer_id: str) -> dict:
    existing = store.get_campaign_by_id(campaign_id)
    if not existing:
        raise ValueError("Campaign not found")
    if existing["status"] != "PENDING":
        raise ValueError("Only PENDING campaigns can be approved")
    updated = store.update_campaign(campaign_id, {"status": "ACTIVE", "rejection_remarks": ""})
    return Campaign.from_dict(updated).to_dict()


def reject_campaign(campaign_id: str, reviewer_id: str, remarks: str) -> dict:
    """PM-03: reject a fundraising activity with remarks."""
    if not remarks or not remarks.strip():
        raise ValueError("Rejection remarks are required")
    existing = store.get_campaign_by_id(campaign_id)
    if not existing:
        raise ValueError("Campaign not found")
    if existing["status"] not in ("PENDING", "ACTIVE"):
        raise ValueError("Campaign cannot be rejected in its current status")
    updated = store.update_campaign(campaign_id, {
        "status": "REJECTED",
        "rejection_remarks": remarks.strip(),
    })
    return Campaign.from_dict(updated).to_dict()


def suspend_campaign(campaign_id: str) -> dict:
    existing = store.get_campaign_by_id(campaign_id)
    if not existing:
        raise ValueError("Campaign not found")
    updated = store.update_campaign(campaign_id, {"status": "SUSPENDED"})
    return Campaign.from_dict(updated).to_dict()


def get_campaign_progress(campaign_id: str) -> dict:
    """FR-04: real-time donation progress."""
    c = store.get_campaign_by_id(campaign_id)
    if not c:
        raise ValueError("Campaign not found")
    campaign = Campaign.from_dict(c)
    return {
        "campaign_id": campaign_id,
        "title": campaign.title,
        "goal_amount": campaign.goal_amount,
        "raised_amount": campaign.raised_amount,
        "progress_percent": campaign.progress_percent(),
        "days_remaining": campaign.days_remaining(),
    }


def search_campaign_history(status_list: list = None, category: str = None,
                             fundraiser_id: str = None, keyword: str = None) -> list:
    """PM-10: search history of approved/rejected/suspended campaigns."""
    campaigns = store.get_all_campaigns()

    if status_list:
        campaigns = [c for c in campaigns if c["status"] in status_list]

    if category:
        campaigns = [c for c in campaigns if c.get("category") == category]

    if fundraiser_id:
        campaigns = [c for c in campaigns if c["fundraiser_id"] == fundraiser_id]

    if keyword:
        kw = keyword.lower()
        campaigns = [c for c in campaigns
                     if kw in c["title"].lower() or kw in c.get("description", "").lower()]

    return [Campaign.from_dict(c).to_dict() for c in campaigns]
