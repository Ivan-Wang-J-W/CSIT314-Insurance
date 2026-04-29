"""
User Stories: SA-01
BCE layer: Boundary
Editor: BeiRui
"""

from flask import Blueprint, request, jsonify

import control.user_controller as user_ctrl
from boundary.utils import require_role

user_bp = Blueprint("users", __name__)


@user_bp.post("/")
@require_role("ADMIN")
def create_user():
    """SA-01: create new user accounts (FR, Donees, Platform Managers)."""
    data = request.get_json() or {}
    try:
        user = user_ctrl.create_user(data)
        return jsonify({"user": user}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@user_bp.get("/")
@require_role("ADMIN")
def list_users():
    users = user_ctrl.list_users(
        role=request.args.get("role"),
        status=request.args.get("status"),
    )
    return jsonify({"users": users}), 200


@user_bp.get("/<user_id>")
@require_role("ADMIN")
def get_user(user_id):
    try:
        return jsonify({"user": user_ctrl.get_user(user_id)}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@user_bp.put("/<user_id>")
@require_role("ADMIN")
def update_user(user_id):
    data = request.get_json() or {}
    try:
        user = user_ctrl.update_user(user_id, data)
        return jsonify({"user": user}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@user_bp.post("/<user_id>/toggle-status")
@require_role("ADMIN")
def toggle_status(user_id):
    try:
        user = user_ctrl.toggle_status(user_id)
        return jsonify({"user": user}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@user_bp.delete("/<user_id>")
@require_role("ADMIN")
def delete_user(user_id):
    try:
        user_ctrl.delete_user(user_id)
        return jsonify({"message": "Deleted"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
