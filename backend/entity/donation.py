"""Donation domain entity."""


class Donation:
    def __init__(self, id, campaign_id, donee_id, amount, message="",
                 anonymous=False, created_at=None):
        self.id = id
        self.campaign_id = campaign_id
        self.donee_id = donee_id
        self.amount = float(amount)
        self.message = message
        self.anonymous = anonymous
        self.created_at = created_at

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "campaign_id": self.campaign_id,
            "donee_id": self.donee_id,
            "amount": self.amount,
            "message": self.message,
            "anonymous": self.anonymous,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Donation":
        return cls(
            id=d["id"],
            campaign_id=d["campaign_id"],
            donee_id=d["donee_id"],
            amount=d["amount"],
            message=d.get("message", ""),
            anonymous=d.get("anonymous", False),
            created_at=d.get("created_at"),
        )
