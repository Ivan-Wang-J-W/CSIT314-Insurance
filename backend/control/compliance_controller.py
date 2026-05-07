"""
Compliance controller — fraud report review, escalation, identity status.
User stories: CO-01, CO-05, CO-09.
BCE layer: Control
"""

import data.store as store
from entity.fraud_report import FraudReport
from control.assessor_controller import get_identity_status


def get_fraud_reports(status: str = None, campaign_id: str = None) -> list:
    """CO-01: review fraud reports submitted by donees or escalated by assessors."""
    reports = store.get_all_fraud_reports()

    if status:
        reports = [r for r in reports if r["status"] == status]
    if campaign_id:
        reports = [r for r in reports if r["campaign_id"] == campaign_id]

    return [FraudReport.from_dict(r).to_dict()
            for r in sorted(reports, key=lambda r: r["created_at"], reverse=True)]


def submit_fraud_report(campaign_id: str, donee_id: str, description: str) -> dict:
    """Donees can submit fraud reports (referenced as D-07, feeds into CO-01)."""
    if not description or not description.strip():
        raise ValueError("Description is required")

    campaign = store.get_campaign_by_id(campaign_id)
    if not campaign:
        raise ValueError("Campaign not found")

    report = store.create_fraud_report({
        "campaign_id": campaign_id,
        "reported_by": donee_id,
        "description": description.strip(),
        "status": "PENDING",
        "reviewed_by": None,
        "escalated_to": None,
    })
    return FraudReport.from_dict(report).to_dict()


def review_fraud_report(report_id: str, reviewer_id: str) -> dict:
    """Mark a fraud report as reviewed."""
    report = store.update_fraud_report(report_id, {
        "status": "REVIEWED",
        "reviewed_by": reviewer_id,
    })
    if not report:
        raise ValueError("Fraud report not found")
    return FraudReport.from_dict(report).to_dict()


def escalate_campaign(campaign_id: str, compliance_id: str, notes: str,
                      senior_officer_id: str = None) -> dict:
    """CO-05: escalate a high-risk campaign to a senior officer."""
    campaign = store.get_campaign_by_id(campaign_id)
    if not campaign:
        raise ValueError("Campaign not found")

    reports = store.get_fraud_reports_by_campaign(campaign_id)
    if reports:
        for r in reports:
            if r["status"] in ("PENDING", "REVIEWED"):
                store.update_fraud_report(r["id"], {
                    "status": "ESCALATED",
                    "escalated_to": senior_officer_id or compliance_id,
                })

    store.update_campaign(campaign_id, {"status": "SUSPENDED"})

    return {
        "campaign_id": campaign_id,
        "escalated_by": compliance_id,
        "escalated_to": senior_officer_id or compliance_id,
        "notes": notes,
        "reports_escalated": len(reports),
    }


def view_identity_status(campaign_id: str) -> dict:
    """CO-09: view identity verification status of a fundraiser's campaign."""
    return get_identity_status(campaign_id)


def get_refund_requests(status: str = None) -> list:
    """CO-03: retrieve refund requests with optional status filter."""
    refunds = store.get_all_refunds()
    if status:
        refunds = [r for r in refunds if r["status"] == status]
    return sorted(refunds, key=lambda r: r["created_at"], reverse=True)


def submit_refund_request(donation_id: str, donee_id: str, reason: str) -> dict:
    """Donee submits a refund request for a donation."""
    if not reason or not reason.strip():
        raise ValueError("Reason is required for refund request")
    
    donation = store.get_donation_by_id(donation_id)
    if not donation:
        raise ValueError("Donation not found")
    
    if donation["donee_id"] != donee_id:
        raise ValueError("Cannot request refund for another user's donation")
    
    refund = store.create_refund({
        "donation_id": donation_id,
        "donee_id": donee_id,
        "reason": reason.strip(),
        "amount": donation["amount"],
        "status": "PENDING",
    })
    return refund


def approve_refund(refund_id: str, compliance_id: str) -> dict:
    """CO-03: approve a refund request."""
    refund = store.get_refund_by_id(refund_id)
    if not refund:
        raise ValueError("Refund request not found")
    
    if refund["status"] != "PENDING":
        raise ValueError(f"Cannot approve refund with status {refund['status']}")
    
    updated = store.update_refund(refund_id, {
        "status": "APPROVED",
        "reviewed_by": compliance_id,
        "reviewed_at": "NOW()",
    })
    return updated


def reject_refund(refund_id: str, compliance_id: str, reason: str = "") -> dict:
    """CO-03: reject a refund request."""
    refund = store.get_refund_by_id(refund_id)
    if not refund:
        raise ValueError("Refund request not found")
    
    if refund["status"] != "PENDING":
        raise ValueError(f"Cannot reject refund with status {refund['status']}")
    
    updated = store.update_refund(refund_id, {
        "status": "REJECTED",
        "reviewed_by": compliance_id,
        "reviewed_at": "NOW()",
    })
    return updated


def set_withdrawal_limit(campaign_id: str, limit: float, reason: str = "") -> dict:
    """CO-06: set a maximum withdrawal limit on a campaign during investigation."""
    campaign = store.get_campaign_by_id(campaign_id)
    if not campaign:
        raise ValueError("Campaign not found")
    
    if limit < 0:
        raise ValueError("Withdrawal limit cannot be negative")
    
    updated = store.update_campaign(campaign_id, {
        "withdrawal_limit": limit if limit > 0 else None
    })
    return updated


def get_withdrawal_limit(campaign_id: str) -> dict | None:
    """Get the withdrawal limit for a campaign."""
    campaign = store.get_campaign_by_id(campaign_id)
    if not campaign:
        return None
    
    return {
        "campaign_id": campaign_id,
        "withdrawal_limit": campaign.get("withdrawal_limit"),
        "raised_amount": campaign.get("raised_amount"),
    }
