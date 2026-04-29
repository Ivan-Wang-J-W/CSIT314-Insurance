"""Campaign (Fund Raising Activity) domain entity."""

from datetime import date

STATUSES = frozenset({"PENDING", "ACTIVE", "COMPLETED", "CANCELLED", "REJECTED", "SUSPENDED"})
URGENCY_TIERS = frozenset({"LOW", "MEDIUM", "HIGH", "CRITICAL"})


class Campaign:
    def __init__(self, id, title, description, category, fundraiser_id,
                 goal_amount, raised_amount=0.0, image_url="", start_date=None,
                 end_date=None, status="PENDING", urgency_tier="LOW",
                 rejection_remarks="", withdrawal_held=False, created_at=None):
        self.id = id
        self.title = title
        self.description = description
        self.category = category
        self.fundraiser_id = fundraiser_id
        self.goal_amount = float(goal_amount)
        self.raised_amount = float(raised_amount)
        self.image_url = image_url
        self.start_date = start_date
        self.end_date = end_date
        self.status = status
        self.urgency_tier = urgency_tier
        self.rejection_remarks = rejection_remarks
        self.withdrawal_held = withdrawal_held
        self.created_at = created_at

    def progress_percent(self) -> float:
        if self.goal_amount <= 0:
            return 0.0
        return min(100.0, round(self.raised_amount / self.goal_amount * 100, 2))

    def is_within_10_percent_of_goal(self) -> bool:
        """True when raised amount is >= 90% of goal (used for D-03 alerts)."""
        return self.raised_amount >= self.goal_amount * 0.9

    def is_goal_reached(self) -> bool:
        return self.raised_amount >= self.goal_amount

    def days_remaining(self) -> int | None:
        if not self.end_date:
            return None
        try:
            end = date.fromisoformat(self.end_date)
            return max(0, (end - date.today()).days)
        except ValueError:
            return None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "fundraiser_id": self.fundraiser_id,
            "goal_amount": self.goal_amount,
            "raised_amount": self.raised_amount,
            "image_url": self.image_url,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "status": self.status,
            "urgency_tier": self.urgency_tier,
            "rejection_remarks": self.rejection_remarks,
            "withdrawal_held": self.withdrawal_held,
            "created_at": self.created_at,
            "progress_percent": self.progress_percent(),
            "days_remaining": self.days_remaining(),
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Campaign":
        return cls(
            id=d["id"],
            title=d["title"],
            description=d["description"],
            category=d["category"],
            fundraiser_id=d["fundraiser_id"],
            goal_amount=d["goal_amount"],
            raised_amount=d.get("raised_amount", 0.0),
            image_url=d.get("image_url", ""),
            start_date=d.get("start_date"),
            end_date=d.get("end_date"),
            status=d.get("status", "PENDING"),
            urgency_tier=d.get("urgency_tier", "LOW"),
            rejection_remarks=d.get("rejection_remarks", ""),
            withdrawal_held=d.get("withdrawal_held", False),
            created_at=d.get("created_at"),
        )
