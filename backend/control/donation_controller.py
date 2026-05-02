"""
Donation controller — create donations, history, goal-proximity alerts.
User stories: D-03 (alert near goal), D-08 (milestone feed via campaign).
BCE layer: Control
"""

import data.store as store
from entity.donation import Donation
from entity.campaign import Campaign
from control.notification_controller import push_notification


def create_donation(campaign_id: str, donee_id: str, amount: float,
                    message: str = "", anonymous: bool = False) -> dict:
    """
    Record a donation, update campaign raised_amount, auto-complete if goal hit.
    Sends goal-proximity notifications to all donees who saved the campaign (D-03).
    """
    if float(amount) <= 0:
        raise ValueError("Donation amount must be positive")

    campaign_data = store.get_campaign_by_id(campaign_id)
    if not campaign_data:
        raise ValueError("Campaign not found")
    if campaign_data["status"] != "ACTIVE":
        raise ValueError("Campaign is not active")

    donation = store.create_donation({
        "campaign_id": campaign_id,
        "donee_id": donee_id,
        "amount": float(amount),
        "message": message,
        "anonymous": anonymous,
    })

    new_raised = campaign_data["raised_amount"] + float(amount)
    store.update_campaign(campaign_id, {"raised_amount": new_raised})

    if new_raised >= campaign_data["goal_amount"]:
        store.update_campaign(campaign_id, {"status": "COMPLETED"})

    updated = store.get_campaign_by_id(campaign_id)
    campaign_obj = Campaign.from_dict(updated)
    if campaign_obj.is_within_10_percent_of_goal() and updated["status"] != "COMPLETED":
        _notify_savers_near_goal(campaign_id, campaign_obj.title)

    return Donation.from_dict(donation).to_dict()


def get_donation_history(donee_id: str, category: str = None,
                         start_date: str = None, end_date: str = None) -> list:
    donations = store.get_donations_by_donee(donee_id)

    if start_date:
        donations = [d for d in donations if d["created_at"] >= start_date]
    if end_date:
        donations = [d for d in donations if d["created_at"] <= end_date]
    if category:
        campaign_ids = {
            c["id"] for c in store.get_all_campaigns() if c.get("category") == category
        }
        donations = [d for d in donations if d["campaign_id"] in campaign_ids]

    return [Donation.from_dict(d).to_dict()
            for d in sorted(donations, key=lambda x: x["created_at"], reverse=True)]


def get_donations_for_campaign(campaign_id: str) -> list:
    donations = store.get_donations_by_campaign(campaign_id)
    return [Donation.from_dict(d).to_dict() for d in donations]


def get_goal_alerts(donee_id: str) -> list:
    """D-03: return saved campaigns within 10% of their funding goal."""
    favorites = store.get_favorites_by_donee(donee_id)
    alerts = []
    for fav in favorites:
        c = store.get_campaign_by_id(fav["campaign_id"])
        if not c or c["status"] != "ACTIVE":
            continue
        campaign = Campaign.from_dict(c)
        if campaign.is_within_10_percent_of_goal():
            alerts.append({
                **campaign.to_dict(),
                "alert_message": f"'{campaign.title}' is within 10% of its goal!",
            })
    return alerts


def toggle_favorite(donee_id: str, campaign_id: str) -> dict:
    """Save or unsave a campaign for a donee."""
    existing = store.get_favorite(donee_id, campaign_id)
    if existing:
        store.delete_favorite(existing["id"])
        return {"saved": False, "campaign_id": campaign_id}
    store.create_favorite(donee_id, campaign_id)
    return {"saved": True, "campaign_id": campaign_id}


def get_favorites_for_donee(donee_id: str) -> list:
    """Return full campaign objects for all campaigns saved by this donee."""
    favorites = store.get_favorites_by_donee(donee_id)
    campaigns = []
    for fav in favorites:
        c = store.get_campaign_by_id(fav["campaign_id"])
        if c:
            campaigns.append(Campaign.from_dict(c).to_dict())
    return campaigns


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _notify_savers_near_goal(campaign_id: str, campaign_title: str) -> None:
    for fav in store.get_favorites_by_campaign(campaign_id):
        push_notification(
            user_id=fav["donee_id"],
            title="Campaign Near Goal",
            message=f"'{campaign_title}' is within 10% of its fundraising goal!",
            notif_type="warning",
        )
