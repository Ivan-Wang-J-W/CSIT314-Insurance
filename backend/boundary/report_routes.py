"""
Report routes — PM-08 (daily report), SA-07 (system metrics), time series.
BCE layer: Boundary
"""

from flask import Blueprint, request, jsonify

import control.report_controller as report_ctrl
from boundary.utils import require_role

report_bp = Blueprint("reports", __name__)


@report_bp.get("/public")
def public_stats():
    """Public summary stats — no auth required (used by the landing page)."""
    return jsonify(report_ctrl.public_stats()), 200


@report_bp.get("/daily")
@require_role("PLATFORM_MANAGER", "ADMIN")
def daily_report():
    """PM-08: generate daily report of fundraising activity."""
    target_date = request.args.get("date")
    return jsonify(report_ctrl.daily_report(target_date)), 200


@report_bp.get("/metrics")
@require_role("PLATFORM_MANAGER", "ADMIN")
def system_metrics():
    """SA-07: monitor system performance metrics."""
    return jsonify(report_ctrl.system_metrics()), 200


@report_bp.get("/series")
@require_role("PLATFORM_MANAGER", "ADMIN")
def time_series():
    """Return aggregated time-series data for the Reports page."""
    period = request.args.get("period", "daily")
    n = int(request.args.get("n", 14))
    series = report_ctrl.time_series(period, n)
    return jsonify({"series": series}), 200
