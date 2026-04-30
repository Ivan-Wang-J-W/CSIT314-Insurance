"""
Compliance routes — CO-01 (fraud reports), CO-05 (escalate), CO-09 (identity status).
BCE layer: Boundary
"""

from flask import Blueprint, request, jsonify, g

import control.compliance_controller as compliance_ctrl
from boundary.utils import require_role

compliance_bp = Blueprint("compliance", __name__)


@compliance_bp.get("/fraud-reports")
@require_role("COMPLIANCE", "ADMIN")
def list_fraud_reports():
    """CO-01: review fraud reports submitted by donees."""
    reports = compliance_ctrl.get_fraud_reports(
        status=request.args.get("status"),
        campaign_id=request.args.get("campaign_id"),
    )
    return jsonify({"fraud_reports": reports}), 200


@compliance_bp.post("/fraud-reports")
@require_role("DONEE")
def submit_fraud_report():
    """Donee submits a fraud report (D-07, feeds into CO-01)."""
    data = request.get_json() or {}
    try:
        report = compliance_ctrl.submit_fraud_report(
            campaign_id=data.get("campaign_id", ""),
            donee_id=g.current_user["id"],
            description=data.get("description", ""),
        )
        return jsonify({"fraud_report": report}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@compliance_bp.post("/fraud-reports/<report_id>/review")
@require_role("COMPLIANCE")
def review_fraud_report(report_id):
    try:
        report = compliance_ctrl.review_fraud_report(report_id, g.current_user["id"])
        return jsonify({"fraud_report": report}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@compliance_bp.post("/campaigns/<campaign_id>/escalate")
@require_role("COMPLIANCE")
def escalate_campaign(campaign_id):
    """CO-05: escalate high-risk campaign to senior officer."""
    data = request.get_json() or {}
    try:
        result = compliance_ctrl.escalate_campaign(
            campaign_id=campaign_id,
            compliance_id=g.current_user["id"],
            notes=data.get("notes", ""),
            senior_officer_id=data.get("senior_officer_id"),
        )
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@compliance_bp.get("/campaigns/<campaign_id>/identity-status")
@require_role("COMPLIANCE", "ADMIN")
def identity_status(campaign_id):
    """CO-09: view identity verification status of Fund Raiser."""
    try:
        return jsonify(compliance_ctrl.view_identity_status(campaign_id)), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
