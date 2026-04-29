"""Milestone domain entity — progress updates posted by fundraisers (FR-07 / D-08)."""


class Milestone:
    def __init__(self, id, campaign_id, fundraiser_id, title, description="",
                 created_at=None):
        self.id = id
        self.campaign_id = campaign_id
        self.fundraiser_id = fundraiser_id
        self.title = title
        self.description = description
        self.created_at = created_at

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "campaign_id": self.campaign_id,
            "fundraiser_id": self.fundraiser_id,
            "title": self.title,
            "description": self.description,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Milestone":
        return cls(
            id=d["id"],
            campaign_id=d["campaign_id"],
            fundraiser_id=d["fundraiser_id"],
            title=d["title"],
            description=d.get("description", ""),
            created_at=d.get("created_at"),
        )
