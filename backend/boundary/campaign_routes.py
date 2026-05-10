"""
Campaign routes — G-01, D-01, FR-02, FR-04, FR-07, D-08, PM-03, PM-10.
BCE layer: Boundary
"""

from flask import Blueprint, request, jsonify, g

import control.campaign_controller as camp_ctrl
import control.milestone_controller as milestone_ctrl
import control.donation_controller as donation_ctrl
from boundary.utils import require_auth, require_role

campaign_bp = Blueprint("campaigns", __name__)


@campaign_bp.get("/")
def list_campaigns():
    """G-01: browse campaigns without login. D-01: filter by urgency_tier."""
    keyword = request.args.get("q") or request.args.get("keyword")
    category = request.args.get("category")
    fundraiser_id = request.args.get("fundraiser_id")
    status = request.args.get("status")
    urgency_tier = request.args.get("urgency_tier")
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 12))

    campaigns = camp_ctrl.list_campaigns(
        urgency_tier=urgency_tier,
        category=category,
        keyword=keyword,
        status=status,
        fundraiser_id=fundraiser_id,
    )
    total = len(campaigns)
    start = (page - 1) * page_size
    paged = campaigns[start: start + page_size]
    return jsonify({"campaigns": paged, "total": total}), 200


@campaign_bp.get("/history")
@require_role("PLATFORM_MANAGER", "ADMIN")
def campaign_history():
    """PM-10: search history of approved/rejected/suspended campaigns."""
    status_param = request.args.get("status")
    status_list = status_param.split(",") if status_param else None
    keyword = request.args.get("q") or request.args.get("keyword")
    campaigns = camp_ctrl.search_campaign_history(
        status_list=status_list,
        category=request.args.get("category"),
        fundraiser_id=request.args.get("fundraiser_id"),
        keyword=keyword,
    )
    return jsonify({"campaigns": campaigns, "total": len(campaigns)}), 200


@campaign_bp.get("/favorites")
@require_role("DONEE")
def get_favorites():
    """Return all campaigns saved by the current donee."""
    campaigns = donation_ctrl.get_favorites_for_donee(g.current_user["id"])
    return jsonify({"campaigns": campaigns}), 200


@campaign_bp.get("/<campaign_id>")
def get_campaign(campaign_id):
    try:
        return jsonify({"campaign": camp_ctrl.get_campaign(campaign_id)}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@campaign_bp.post("/")
@require_role("FUNDRAISER")
def create_campaign():
    """FR-02: upload images and detailed descriptions for a campaign."""
    data = request.get_json() or {}
    try:
        campaign = camp_ctrl.create_campaign(data, g.current_user["id"])
        return jsonify({"campaign": campaign}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@campaign_bp.put("/<campaign_id>")
@require_role("FUNDRAISER")
def update_campaign(campaign_id):
    data = request.get_json() or {}
    try:
        campaign = camp_ctrl.update_campaign(campaign_id, data, g.current_user["id"])
        return jsonify({"campaign": campaign}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@campaign_bp.delete("/<campaign_id>")
@require_role("FUNDRAISER")
def delete_campaign(campaign_id):
    try:
        camp_ctrl.delete_campaign(campaign_id, g.current_user["id"])
        return jsonify({"message": "Deleted"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@campaign_bp.get("/<campaign_id>/progress")
def get_progress(campaign_id):
    """FR-04: real-time donation progress."""
    try:
        return jsonify(camp_ctrl.get_campaign_progress(campaign_id)), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@campaign_bp.get("/<campaign_id>/donations")
def get_campaign_donations(campaign_id):
    """Return all donations for a specific campaign."""
    donations = donation_ctrl.get_donations_for_campaign(campaign_id)
    return jsonify({"donations": donations}), 200


@campaign_bp.post("/<campaign_id>/approve")
@require_role("PLATFORM_MANAGER")
def approve_campaign(campaign_id):
    try:
        campaign = camp_ctrl.approve_campaign(campaign_id, g.current_user["id"])
        return jsonify({"campaign": campaign}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@campaign_bp.post("/<campaign_id>/reject")
@require_role("PLATFORM_MANAGER")
def reject_campaign(campaign_id):
    """PM-03: reject a fundraising activity with remarks."""
    data = request.get_json() or {}
    try:
        campaign = camp_ctrl.reject_campaign(
            campaign_id, g.current_user["id"], data.get("remarks", "")
        )
        return jsonify({"campaign": campaign}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@campaign_bp.post("/<campaign_id>/suspend")
@require_role("PLATFORM_MANAGER", "ADMIN")
def suspend_campaign(campaign_id):
    try:
        campaign = camp_ctrl.suspend_campaign(campaign_id)
        return jsonify({"campaign": campaign}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


# ---------------------------------------------------------------------------
# Milestone sub-resource
# ---------------------------------------------------------------------------

@campaign_bp.post("/<campaign_id>/milestones")
@require_role("FUNDRAISER")
def post_milestone(campaign_id):
    """FR-07: post a milestone update."""
    data = request.get_json() or {}
    try:
        milestone = milestone_ctrl.post_milestone(
            campaign_id,
            g.current_user["id"],
            data.get("title", ""),
            data.get("description", ""),
        )
        return jsonify({"milestone": milestone}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@campaign_bp.get("/<campaign_id>/milestones")
def get_milestones(campaign_id):
    """D-08: live milestone feed."""
    try:
        return jsonify({"milestones": milestone_ctrl.get_milestones(campaign_id)}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


# ---------------------------------------------------------------------------
# Favorite sub-resource
# ---------------------------------------------------------------------------

@campaign_bp.post("/<campaign_id>/favorite")
@require_role("DONEE")
def toggle_favorite(campaign_id):
    result = donation_ctrl.toggle_favorite(g.current_user["id"], campaign_id)
    return jsonify(result), 200
