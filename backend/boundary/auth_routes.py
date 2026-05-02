"""
Auth routes — G-07 (register), G-09 (login), logout, profile.
BCE layer: Boundary
"""

from flask import Blueprint, request, jsonify, g

import control.auth_controller as auth_ctrl
import control.user_controller as user_ctrl
from boundary.utils import require_auth

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    """(G-07): To register as a Donee (or any role when called by admin)."""
    data = request.get_json() or {}
    try:
        user = auth_ctrl.register(data)
        return jsonify({"user": user}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@auth_bp.post("/login")
def login():
    """(G-09): To log in to existing account."""
    data = request.get_json() or {}
    try:
        token, user = auth_ctrl.login(
            data.get("username", ""),
            data.get("password", ""),
        )
        return jsonify({"token": token, "user": user}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 401


@auth_bp.post("/logout")
@require_auth
def logout():
    token = request.headers.get("Authorization", "")[7:]
    auth_ctrl.logout(token)
    return jsonify({"message": "Logged out"}), 200


@auth_bp.get("/me")
@require_auth
def me():
    return jsonify({"user": {k: v for k, v in g.current_user.items()
                             if k != "password_hash"}}), 200


@auth_bp.put("/me")
@require_auth
def update_me():
    """Self-service profile update (full_name, email)."""
    data = request.get_json() or {}
    try:
        user = user_ctrl.update_user(g.current_user["id"], data)
        return jsonify({"user": user}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
