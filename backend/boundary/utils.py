"""
Boundary utilities — auth decorators shared across all route blueprints.
BCE layer: Boundary (supporting infrastructure)
"""

from functools import wraps
from flask import request, jsonify, g

import data.store as store


def _extract_token() -> str | None:
    header = request.headers.get("Authorization", "")
    if header.startswith("Bearer "):
        return header[7:]
    return None


def _resolve_user() -> dict | None:
    token = _extract_token()
    if not token:
        return None
    user_id = store.get_user_id_by_token(token)
    if not user_id:
        return None
    return store.get_user_by_id(user_id)


def require_auth(f):
    """Reject requests without a valid session token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = _resolve_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        if user.get("status") != "ACTIVE":
            return jsonify({"error": "Account is suspended"}), 403
        g.current_user = user
        return f(*args, **kwargs)
    return decorated


def require_role(*roles):
    """Reject requests where the authenticated user's role is not in *roles*."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = _resolve_user()
            if not user:
                return jsonify({"error": "Unauthorized"}), 401
            if user.get("status") != "ACTIVE":
                return jsonify({"error": "Account is suspended"}), 403
            if user.get("role") not in roles:
                return jsonify({"error": "Forbidden"}), 403
            g.current_user = user
            return f(*args, **kwargs)
        return decorated
    return decorator
