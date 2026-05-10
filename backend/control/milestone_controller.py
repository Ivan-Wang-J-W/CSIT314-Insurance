"""
Milestone controller — post and read campaign milestones.
User stories: FR-07 (post milestone), D-08 (view milestone feed).
BCE layer: Control
"""

import data.store as store
from entity.milestone import Milestone


def post_milestone(campaign_id: str, fundraiser_id: str, title: str,
                   description: str = "") -> dict:
    """FR-07: fundraiser posts a milestone update to their campaign."""
    if not title or not title.strip():
        raise ValueError("Milestone title is required")

    campaign = store.get_campaign_by_id(campaign_id)
    if not campaign:
        raise ValueError("Campaign not found")
    if campaign["fundraiser_id"] != fundraiser_id:
        raise ValueError("Not authorised to post milestones for this campaign")
    if campaign["status"] not in ("ACTIVE", "COMPLETED"):
        raise ValueError("Milestones can only be posted on active or completed campaigns")

    milestone = store.create_milestone({
        "campaign_id": campaign_id,
        "fundraiser_id": fundraiser_id,
        "title": title.strip(),
        "description": description.strip(),
    })
    return Milestone.from_dict(milestone).to_dict()


def get_milestones(campaign_id: str) -> list:
    """D-08: live milestone feed for a campaign."""
    campaign = store.get_campaign_by_id(campaign_id)
    if not campaign:
        raise ValueError("Campaign not found")
    milestones = store.get_milestones_by_campaign(campaign_id)
    return [Milestone.from_dict(m).to_dict() for m in milestones]
