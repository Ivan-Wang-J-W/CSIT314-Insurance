"""
User Stories: SA-09
BCE layer: Boundary
Editor: BeiRui
"""

from flask import Blueprint, request, jsonify

import control.config_controller as config_ctrl
from boundary.utils import require_role

config_bp = Blueprint("config", __name__)


@config_bp.get("/config")
@require_role("ADMIN")
def get_config():
    """SA-09: retrieve all platform configuration settings."""
    return jsonify({"config": config_ctrl.get_config()}), 200


@config_bp.put("/config/<key>")
@require_role("ADMIN")
def update_config(key):
    """SA-09: update a single configuration value."""
    data = request.get_json() or {}
    try:
        updated = config_ctrl.update_config(key, data.get("value"))
        return jsonify({"config": updated}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
