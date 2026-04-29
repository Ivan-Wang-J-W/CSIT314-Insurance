"""
Report routes — PM-08 (daily report), SA-07 (system metrics).
BCE layer: Boundary
"""

from flask import Blueprint, request, jsonify

import control.report_controller as report_ctrl
from boundary.utils import require_role

report_bp = Blueprint("reports", __name__)


@report_bp.get("/daily")
@require_role("PLATFORM_MANAGER", "ADMIN")
def daily_report():
    """PM-08: generate daily report of fundraising activity."""
    target_date = request.args.get("date")
    return jsonify(report_ctrl.daily_report(target_date)), 200


@report_bp.get("/metrics")
@require_role("ADMIN")
def system_metrics():
    """SA-07: monitor system performance metrics."""
    return jsonify(report_ctrl.system_metrics()), 200
