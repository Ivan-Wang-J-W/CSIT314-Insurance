"""
User Stories: SA-01
BCE layer: Control
Editor: BeiRui
"""

from werkzeug.security import generate_password_hash

import data.store as store
from entity.user import User, ROLES


def create_user(data: dict) -> dict:
    """SA-01: admin creates user accounts for any role."""
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "DONEE")
    full_name = data.get("full_name", "").strip()

    if not username or not email or not password or not full_name:
        raise ValueError("username, email, password, and full_name are required")
    if role not in ROLES:
        raise ValueError(f"Invalid role: {role}")
    if store.get_user_by_username(username):
        raise ValueError("Username already taken")
    if store.get_user_by_email(email):
        raise ValueError("Email already registered")

    user = store.create_user({
        "username": username,
        "email": email,
        "password_hash": generate_password_hash(password),
        "role": role,
        "full_name": full_name,
        "phone": data.get("phone", ""),
        "status": "ACTIVE",
    })
    return _safe(user)


def list_users(q: str = None, role: str = None, status: str = None) -> list:
    users = store.get_all_users()
    if role:
        users = [u for u in users if u["role"] == role]
    if status:
        users = [u for u in users if u["status"] == status]
    if q:
        q_lower = q.lower()
        users = [u for u in users if
                 q_lower in u["username"].lower()
                 or q_lower in u.get("email", "").lower()
                 or q_lower in u.get("full_name", "").lower()]
    return [_safe(u) for u in users]


def get_user(user_id: str) -> dict:
    user = store.get_user_by_id(user_id)
    if not user:
        raise ValueError("User not found")
    return _safe(user)


def update_user(user_id: str, patch: dict) -> dict:
    if not store.get_user_by_id(user_id):
        raise ValueError("User not found")
    allowed = {"full_name", "phone", "email"}
    safe_patch = {k: v for k, v in patch.items() if k in allowed}
    updated = store.update_user(user_id, safe_patch)
    return _safe(updated)


def toggle_status(user_id: str) -> dict:
    user = store.get_user_by_id(user_id)
    if not user:
        raise ValueError("User not found")
    new_status = "SUSPENDED" if user["status"] == "ACTIVE" else "ACTIVE"
    updated = store.update_user(user_id, {"status": new_status})
    return _safe(updated)


def delete_user(user_id: str) -> None:
    if not store.get_user_by_id(user_id):
        raise ValueError("User not found")
    store.delete_user(user_id)


def get_stats() -> dict:
    """SA-07: counts by role and status for the metrics dashboard."""
    users = store.get_all_users()
    by_role = {}
    for u in users:
        by_role[u["role"]] = by_role.get(u["role"], 0) + 1
    active = sum(1 for u in users if u["status"] == "ACTIVE")
    return {
        "total": len(users),
        "active": active,
        "suspended": len(users) - active,
        "by_role": by_role,
    }


def _safe(user: dict) -> dict:
    return {k: v for k, v in user.items() if k != "password_hash"}
