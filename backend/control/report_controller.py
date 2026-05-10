"""
Report controller — platform-level analytics and daily reports.
User stories: PM-08 (daily report), SA-07 (system performance metrics).
BCE layer: Control
"""

from datetime import date, datetime, timedelta

import data.store as store


def public_stats() -> dict:
    """Public stats for the landing page — no auth required."""
    all_campaigns = store.get_all_campaigns()
    all_donations = store.get_all_donations()
    return {
        "total_campaigns": len(all_campaigns),
        "active_campaigns": sum(1 for c in all_campaigns if c["status"] == "ACTIVE"),
        "total_donations": len(all_donations),
        "total_raised": sum(d["amount"] for d in all_donations),
    }


def daily_report(target_date: str = None) -> dict:
    """PM-08: generate a daily report of fundraising activity."""
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

    unique_categories = len({c.get("category") for c in all_campaigns if c.get("category")})

    return {
        "total_users": len(all_users),
        "users_by_role": by_role,
        "total_campaigns": len(all_campaigns),
        "active_campaigns": len(active_campaigns),
        "completed_campaigns": len(completed_campaigns),
        "total_donations": len(all_donations),
        "total_raised": total_raised,
        "average_donation": (total_raised / len(all_donations)) if all_donations else 0,
        "total_categories": unique_categories,
    }


def time_series(period: str = "daily", n: int = 14) -> list:
    """Return aggregated time-series buckets for the Reports page."""
    all_donations = store.get_all_donations()
    all_campaigns = store.get_all_campaigns()
    all_users = store.get_all_users()

    today = date.today()
    buckets = []

    if period == "daily":
        for i in range(n - 1, -1, -1):
            d = today - timedelta(days=i)
            label = d.strftime("%b %d")
            prefix = d.isoformat()
            buckets.append({
                "label": label,
                "prefix": prefix,
                "match": lambda s, p=prefix: s.startswith(p),
            })
    elif period == "weekly":
        for i in range(n - 1, -1, -1):
            week_start = today - timedelta(weeks=i, days=today.weekday())
            week_end = week_start + timedelta(days=6)
            label = week_start.strftime("%b %d")
            buckets.append({
                "label": label,
                "match": lambda s, ws=week_start.isoformat(), we=week_end.isoformat(): ws <= s[:10] <= we,
            })
    else:  # monthly
        for i in range(n - 1, -1, -1):
            month = today.month - i
            year = today.year + (month - 1) // 12
            month = ((month - 1) % 12) + 1
            prefix = f"{year:04d}-{month:02d}"
            label = date(year, month, 1).strftime("%b %Y")
            buckets.append({
                "label": label,
                "match": lambda s, p=prefix: s.startswith(p),
            })

    series = []
    for bucket in buckets:
        match = bucket["match"]
        donations = [d for d in all_donations if match(d["created_at"])]
        new_fsas = [c for c in all_campaigns if match(c["created_at"])]
        new_users = [u for u in all_users if match(u["created_at"])]
        series.append({
            "label": bucket["label"],
            "donations": len(donations),
            "amount": sum(d["amount"] for d in donations),
            "newFSAs": len(new_fsas),
            "newUsers": len(new_users),
        })

    return series
