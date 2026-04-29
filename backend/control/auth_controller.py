"""
Auth controller — G-07 (register as Donee), G-09 (login).
BCE layer: Control
"""

from werkzeug.security import generate_password_hash, check_password_hash

import data.store as store


def register(data: dict) -> dict:
    """
    1. Register a new user account.
    2. (G-07) Self-registration is open to DONEE role.
    Admin-provisioned roles (ADMIN, PLATFORM_MANAGER, ASSESSOR, COMPLIANCE, FUNDRAISER)
    are also be created here when called from the admin user controller.
    Returns the created user dict without password_hash.
    Raises ValueError when faliure to validate.
    """
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "DONEE")
    full_name = data.get("full_name", "").strip()

    if not username or not email or not password or not full_name:
        raise ValueError("username, email, password, and full_name are required")

    if role not in ("DONEE", "FUNDRAISER", "ADMIN", "PLATFORM_MANAGER", "ASSESSOR", "COMPLIANCE"):
        raise ValueError(f"Invalid role: {role}")

    if store.get_user_by_username(username):
        raise ValueError("Username already taken")

    if store.get_user_by_email(email):
        raise ValueError("Email address is already registered")

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


def login(username: str, password: str) -> tuple[str, dict]:
    """
    1. Authenticate and issue a session token.
    2. (G-09): log in to an existing account.
    3. Returns (token, safe_user) or raises ValueError when failure to validate.
    """
    user = store.get_user_by_username(username)
    if not user:
        raise ValueError("Invalid credentials")

    if not check_password_hash(user["password_hash"], password):
        raise ValueError("Invalid credentials")

    if user["status"] != "ACTIVE":
        raise ValueError("Account has been suspended")

    token = store.create_session(user["id"])
    return token, _safe(user)


def logout(token: str) -> None:
    """Invalidate a session token."""
    store.delete_session(token)


def get_current_user(token: str) -> dict | None:
    """Resolve a session token to a safe user dict."""
    user_id = store.get_user_id_by_token(token)
    if not user_id:
        return None
    user = store.get_user_by_id(user_id)
    if not user:
        return None
    return _safe(user)


def _safe(user: dict) -> dict:
    return {k: v for k, v in user.items() if k != "password_hash"}
