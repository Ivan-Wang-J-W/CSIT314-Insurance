"""
Donation routes — donate, donation history, goal alerts (D-03).
BCE layer: Boundary
"""

from flask import Blueprint, request, jsonify, g

import control.donation_controller as donation_ctrl
import control.notification_controller as notif_ctrl
from boundary.utils import require_role, require_auth

donation_bp = Blueprint("donations", __name__)


@donation_bp.post("/")
@require_role("DONEE")
def create_donation():
    data = request.get_json() or {}
    try:
        donation = donation_ctrl.create_donation(
            campaign_id=data.get("campaign_id", ""),
            donee_id=g.current_user["id"],
            amount=data.get("amount", 0),
            message=data.get("message", ""),
            anonymous=data.get("anonymous", False),
        )
        return jsonify({"donation": donation}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@donation_bp.get("/history")
@require_role("DONEE")
def donation_history():
    donations = donation_ctrl.get_donation_history(
        donee_id=g.current_user["id"],
        category=request.args.get("category"),
        start_date=request.args.get("start_date"),
        end_date=request.args.get("end_date"),
    )
    return jsonify({"donations": donations}), 200


@donation_bp.get("/alerts")
@require_role("DONEE")
def goal_alerts():
    """D-03: campaigns within 10% of goal that the donee has saved."""
    alerts = donation_ctrl.get_goal_alerts(g.current_user["id"])
    return jsonify({"alerts": alerts}), 200


@donation_bp.get("/notifications")
@require_auth
def notifications():
    notifs = notif_ctrl.get_notifications(g.current_user["id"])
    return jsonify({"notifications": notifs}), 200


@donation_bp.post("/notifications/<notif_id>/read")
@require_auth
def mark_read(notif_id):
    try:
        notif = notif_ctrl.mark_read(notif_id)
        return jsonify({"notification": notif}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
