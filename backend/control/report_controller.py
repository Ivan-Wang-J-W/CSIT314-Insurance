"""
Report controller — platform-level analytics and daily reports.
User stories: PM-08 (daily report), SA-07 (system performance metrics).
BCE layer: Control
"""

from datetime import date, datetime

import data.store as store


def daily_report(target_date: str = None) -> dict:
    """
    PM-08: generate a daily report of fundraising activity.
    target_date: ISO date string (YYYY-MM-DD); defaults to today.
    """
    report_date = target_date or date.today().isoformat()

    all_campaigns = store.get_all_campaigns()
    all_donations = store.get_all_donations()

    day_campaigns = [c for c in all_campaigns if c["created_at"].startswith(report_date)]
    day_donations = [d for d in all_donations if d["created_at"].startswith(report_date)]

    approved = [c for c in all_campaigns
                if c["status"] == "ACTIVE" and c.get("created_at", "").startswith(report_date)]
    rejected = [c for c in all_campaigns
                if c["status"] == "REJECTED" and c.get("created_at", "").startswith(report_date)]
    suspended = [c for c in all_campaigns if c["status"] == "SUSPENDED"]

    total_amount = sum(d["amount"] for d in day_donations)

    return {
        "date": report_date,
        "new_campaigns": len(day_campaigns),
        "donations_count": len(day_donations),
        "total_donated": total_amount,
        "approved_campaigns": len(approved),
        "rejected_campaigns": len(rejected),
        "suspended_campaigns": len(suspended),
        "campaign_summary": [
            {"id": c["id"], "title": c["title"], "status": c["status"]}
            for c in day_campaigns
        ],
    }


def system_metrics() -> dict:
    """SA-07: high-level platform performance metrics."""
    all_users = store.get_all_users()
    all_campaigns = store.get_all_campaigns()
    all_donations = store.get_all_donations()

    total_raised = sum(d["amount"] for d in all_donations)
    active_campaigns = [c for c in all_campaigns if c["status"] == "ACTIVE"]
    completed_campaigns = [c for c in all_campaigns if c["status"] == "COMPLETED"]

    by_role: dict = {}
    for u in all_users:
        by_role[u["role"]] = by_role.get(u["role"], 0) + 1

    return {
        "total_users": len(all_users),
        "users_by_role": by_role,
        "total_campaigns": len(all_campaigns),
        "active_campaigns": len(active_campaigns),
        "completed_campaigns": len(completed_campaigns),
        "total_donations": len(all_donations),
        "total_raised": total_raised,
        "average_donation": (total_raised / len(all_donations)) if all_donations else 0,
    }
