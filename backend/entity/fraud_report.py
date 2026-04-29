"""Fraud report entity — filed by a donee against a campaign (CO-01)."""

# The set of valid status values a fraud report can have
# Using frozenset means this list can't be changed accidentally
STATUSES = frozenset({"PENDING", "REVIEWED", "ESCALATED", "CLOSED"})


# Entity class representing a single fraud report record
class FraudReport:
    # Constructor — sets up a new FraudReport object with all its fields
    def __init__(self, id, campaign_id, reported_by, description,
                 status="PENDING", reviewed_by=None, escalated_to=None,
                 created_at=None):
        self.id = id                          # Unique ID of this report
        self.campaign_id = campaign_id        # The campaign being reported
        self.reported_by = reported_by        # User who filed the report
        self.description = description        # Reason / details of the report
        self.status = status                  # Current status (defaults to PENDING)
        self.reviewed_by = reviewed_by        # Assessor who reviewed it (if any)
        self.escalated_to = escalated_to      # Who it was escalated to (if any)
        self.created_at = created_at          # Timestamp when the report was created

    # Convert the object into a plain dictionary (e.g. for saving or sending as JSON)
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "campaign_id": self.campaign_id,
            "reported_by": self.reported_by,
            "description": self.description,
            "status": self.status,
            "reviewed_by": self.reviewed_by,
            "escalated_to": self.escalated_to,
            "created_at": self.created_at,
        }

    # Class method to build a FraudReport object from a dictionary
    # Useful when loading data back from the database/store
    @classmethod
    def from_dict(cls, d: dict) -> "FraudReport":
        return cls(
            id=d["id"],                                # Required field
            campaign_id=d["campaign_id"],              # Required field
            reported_by=d["reported_by"],              # Required field
            description=d["description"],              # Required field
            status=d.get("status", "PENDING"),         # Default to PENDING if missing
            reviewed_by=d.get("reviewed_by"),          # Optional — may be None
            escalated_to=d.get("escalated_to"),        # Optional — may be None
            created_at=d.get("created_at"),            # Optional — may be None
        )
