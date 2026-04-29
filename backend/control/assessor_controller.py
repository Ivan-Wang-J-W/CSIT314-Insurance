"""
Assessor controller — identity verification, fraud flagging, withdrawal holds.
User stories: AS-02, AS-04, AS-09.
BCE layer: Control
"""

# Import the data store module which handles reading/writing records
import data.store as store
# Import the FraudReport entity class used to format fraud report data
from entity.fraud_report import FraudReport


# Function to verify the identity of a campaign organiser
def verify_identity(campaign_id: str, assessor_id: str,
                    documents: list, notes: str = "") -> dict:
    """AS-02: verify identity of the campaign organiser."""
    # Look up the campaign by its ID
    campaign = store.get_campaign_by_id(campaign_id)
    # If the campaign doesn't exist, stop and raise an error
    if not campaign:
        raise ValueError("Campaign not found")

    # Check whether this campaign already has a verification record
    existing = store.get_verification_by_campaign(campaign_id)
    if existing:
        # If it does, update the existing record with the new info
        updated = store.update_verification(existing["id"], {
            "verified_by": assessor_id,   # Who verified
            "status": "VERIFIED",         # Mark as verified
            "documents": documents,       # Attach supporting docs
            "notes": notes,               # Save assessor notes
        })
        # Return the updated record
        return updated

    # If no existing record, create a brand new verification record
    verification = store.create_verification({
        "campaign_id": campaign_id,
        "fundraiser_id": campaign["fundraiser_id"],   # Link to the fundraiser
        "verified_by": assessor_id,
        "status": "VERIFIED",
        "documents": documents,
        "notes": notes,
    })
    # Return the new record
    return verification


# Function to flag a campaign as fraudulent and escalate it
def flag_as_fraudulent(campaign_id: str, assessor_id: str, reason: str) -> dict:
    """AS-04: flag a campaign as potentially fraudulent and escalate to Compliance."""
    # Make sure a reason was actually given (not empty or only spaces)
    if not reason or not reason.strip():
        raise ValueError("Reason is required to flag a campaign")

    # Look up the campaign — must exist before flagging
    campaign = store.get_campaign_by_id(campaign_id)
    if not campaign:
        raise ValueError("Campaign not found")

    # Create a new fraud report in the data store
    report = store.create_fraud_report({
        "campaign_id": campaign_id,
        "reported_by": assessor_id,            # Assessor who reported it
        "description": reason.strip(),         # Cleaned-up reason text
        "status": "ESCALATED",                 # Mark as escalated
        "reviewed_by": assessor_id,
        "escalated_to": None,                  # Not yet assigned to compliance
    })

    # Suspend the campaign so it can't keep collecting funds while under review
    store.update_campaign(campaign_id, {"status": "SUSPENDED"})
    # Convert the raw record into a FraudReport object, then back to dict for return
    return FraudReport.from_dict(report).to_dict()


# Function to place a temporary hold on a campaign's withdrawals
def place_withdrawal_hold(campaign_id: str, assessor_id: str, reason: str) -> dict:
    """AS-09: place a temporary hold on fund withdrawals under investigation."""
    # Reason must be provided
    if not reason or not reason.strip():
        raise ValueError("Reason is required to place a hold")

    # Make sure the campaign exists
    campaign = store.get_campaign_by_id(campaign_id)
    if not campaign:
        raise ValueError("Campaign not found")

    # Don't allow stacking holds — check if there's already an active one
    existing = store.get_active_hold_by_campaign(campaign_id)
    if existing:
        raise ValueError("An active withdrawal hold already exists for this campaign")

    # Create a new hold record with status ACTIVE
    hold = store.create_hold({
        "campaign_id": campaign_id,
        "placed_by": assessor_id,
        "reason": reason.strip(),
        "status": "ACTIVE",
    })

    # Mark the campaign itself as having an active withdrawal hold
    store.update_campaign(campaign_id, {"withdrawal_held": True})
    # Return the new hold record
    return hold


# Function to lift (remove) an active withdrawal hold
def lift_withdrawal_hold(campaign_id: str) -> dict:
    """Lift an active withdrawal hold (status change only — AS-09 note)."""
    # Find the active hold for this campaign
    hold = store.get_active_hold_by_campaign(campaign_id)
    # If there's no active hold, nothing to lift — raise an error
    if not hold:
        raise ValueError("No active withdrawal hold found for this campaign")

    # Update the hold's status to LIFTED instead of deleting it (keeps history)
    updated = store.update_hold(hold["id"], {"status": "LIFTED"})
    # Update the campaign to show withdrawals are no longer held
    store.update_campaign(campaign_id, {"withdrawal_held": False})
    # Return the updated hold record
    return updated


# Function to fetch the current identity verification status for a campaign
def get_identity_status(campaign_id: str) -> dict:
    """Return the current identity verification record for a campaign."""
    # Make sure the campaign exists first
    campaign = store.get_campaign_by_id(campaign_id)
    if not campaign:
        raise ValueError("Campaign not found")

    # Try to get the verification record for this campaign
    verification = store.get_verification_by_campaign(campaign_id)
    # If no verification exists yet, return a default "PENDING" record
    if not verification:
        return {
            "campaign_id": campaign_id,
            "status": "PENDING",
            "verified_by": None,
            "documents": [],
            "notes": "",
        }
    # Otherwise, return the existing verification record
    return verification
