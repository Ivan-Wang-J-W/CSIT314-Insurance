"""
PostgreSQL-backed data store.

Configure the database via the DATABASE_URL environment variable:
    DATABASE_URL=postgresql://user:password@localhost:5432/frwa

Defaults to: postgresql://postgres:postgres@localhost:5432/frwa
"""

import os
import uuid
from contextlib import contextmanager
from decimal import Decimal

import psycopg2
import psycopg2.extras

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/frwa",
)


@contextmanager
def _db():
    """Yield a connection that auto-commits on success or rolls back on error."""
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _new_id() -> str:
    return str(uuid.uuid4())[:8]


def _row(record) -> dict | None:
    """Convert a RealDictRow to a plain dict, normalising dates and decimals."""
    if record is None:
        return None
    d = dict(record)
    for k, v in d.items():
        if hasattr(v, "isoformat"):
            d[k] = v.isoformat()
        elif isinstance(v, Decimal):
            d[k] = float(v)
    return d


def _rows(records) -> list:
    return [_row(r) for r in (records or [])]


def reset_store() -> None:
    """Truncate all tables and re-seed config defaults (used between tests)."""
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                TRUNCATE TABLE
                    notifications, favorites, withdrawal_holds,
                    identity_verifications, fraud_reports, milestones,
                    donations, campaigns, sessions, users,
                    platform_config
                RESTART IDENTITY CASCADE
            """)
            cur.execute("""
                INSERT INTO platform_config (key, value) VALUES
                    ('max_campaign_goal',          1000000),
                    ('min_campaign_duration_days', 7),
                    ('platform_fee_percent',       5)
            """)


# ---------------------------------------------------------------------------
# User operations
# ---------------------------------------------------------------------------

def get_all_users() -> list:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users ORDER BY created_at")
            return _rows(cur.fetchall())


def get_user_by_id(user_id: str) -> dict | None:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            return _row(cur.fetchone())


def get_user_by_username(username: str) -> dict | None:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE username = %s", (username,))
            return _row(cur.fetchone())


def get_user_by_email(email: str) -> dict | None:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE email = %s", (email,))
            return _row(cur.fetchone())


def create_user(data: dict) -> dict:
    uid = _new_id()
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO users (id, username, email, password_hash, role,
                                   full_name, phone, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                uid,
                data["username"],
                data["email"],
                data["password_hash"],
                data.get("role", "DONEE"),
                data.get("full_name", ""),
                data.get("phone", ""),
                data.get("status", "ACTIVE"),
            ))
            return _row(cur.fetchone())


def update_user(user_id: str, patch: dict) -> dict | None:
    if not patch:
        return get_user_by_id(user_id)
    allowed = {"full_name", "email", "phone", "status", "password_hash"}
    safe = {k: v for k, v in patch.items() if k in allowed}
    if not safe:
        return get_user_by_id(user_id)
    sets = ", ".join(f"{k} = %s" for k in safe)
    vals = list(safe.values()) + [user_id]
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE users SET {sets} WHERE id = %s RETURNING *", vals
            )
            return _row(cur.fetchone())


def delete_user(user_id: str) -> dict | None:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM users WHERE id = %s RETURNING *", (user_id,))
            return _row(cur.fetchone())


# ---------------------------------------------------------------------------
# Campaign operations
# ---------------------------------------------------------------------------

def get_all_campaigns() -> list:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM campaigns ORDER BY created_at")
            return _rows(cur.fetchall())


def get_campaign_by_id(campaign_id: str) -> dict | None:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM campaigns WHERE id = %s", (campaign_id,))
            return _row(cur.fetchone())


def create_campaign(data: dict) -> dict:
    cid = _new_id()
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO campaigns (id, title, description, category, fundraiser_id,
                    goal_amount, raised_amount, image_url, start_date, end_date,
                    status, urgency_tier, rejection_remarks, withdrawal_held)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING *
            """, (
                cid,
                data["title"],
                data["description"],
                data["category"],
                data["fundraiser_id"],
                float(data.get("goal_amount", 0)),
                float(data.get("raised_amount", 0)),
                data.get("image_url", ""),
                data.get("start_date"),
                data.get("end_date"),
                data.get("status", "PENDING"),
                data.get("urgency_tier", "LOW"),
                data.get("rejection_remarks", ""),
                data.get("withdrawal_held", False),
            ))
            return _row(cur.fetchone())


def update_campaign(campaign_id: str, patch: dict) -> dict | None:
    if not patch:
        return get_campaign_by_id(campaign_id)
    allowed = {"title", "description", "category", "goal_amount", "raised_amount",
               "image_url", "start_date", "end_date", "status", "urgency_tier",
               "rejection_remarks", "withdrawal_held", "withdrawal_limit"}
    safe = {k: v for k, v in patch.items() if k in allowed}
    if not safe:
        return get_campaign_by_id(campaign_id)
    sets = ", ".join(f"{k} = %s" for k in safe)
    vals = list(safe.values()) + [campaign_id]
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE campaigns SET {sets} WHERE id = %s RETURNING *", vals
            )
            return _row(cur.fetchone())


def delete_campaign(campaign_id: str) -> dict | None:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM campaigns WHERE id = %s RETURNING *", (campaign_id,))
            return _row(cur.fetchone())


# ---------------------------------------------------------------------------
# Donation operations
# ---------------------------------------------------------------------------

def get_all_donations() -> list:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM donations ORDER BY created_at")
            return _rows(cur.fetchall())


def get_donations_by_campaign(campaign_id: str) -> list:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM donations WHERE campaign_id = %s ORDER BY created_at DESC",
                (campaign_id,),
            )
            return _rows(cur.fetchall())


def get_donations_by_donee(donee_id: str) -> list:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM donations WHERE donee_id = %s ORDER BY created_at DESC",
                (donee_id,),
            )
            return _rows(cur.fetchall())


def get_donation_by_id(donation_id: str) -> dict | None:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM donations WHERE id = %s", (donation_id,))
            return _row(cur.fetchone())


def create_donation(data: dict) -> dict:
    did = _new_id()
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO donations (id, campaign_id, donee_id, amount, message, anonymous)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                did,
                data["campaign_id"],
                data["donee_id"],
                float(data["amount"]),
                data.get("message", ""),
                data.get("anonymous", False),
            ))
            return _row(cur.fetchone())


# ---------------------------------------------------------------------------
# Refund operations
# ---------------------------------------------------------------------------

def get_all_refunds() -> list:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM refunds ORDER BY created_at DESC")
            return _rows(cur.fetchall())


def get_refunds_by_status(status: str) -> list:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM refunds WHERE status = %s ORDER BY created_at DESC",
                (status,),
            )
            return _rows(cur.fetchall())


def get_refund_by_id(refund_id: str) -> dict | None:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM refunds WHERE id = %s", (refund_id,))
            return _row(cur.fetchone())


def create_refund(data: dict) -> dict:
    rid = _new_id()
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO refunds (id, donation_id, donee_id, reason, amount, status)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                rid,
                data["donation_id"],
                data["donee_id"],
                data["reason"],
                float(data["amount"]),
                data.get("status", "PENDING"),
            ))
            return _row(cur.fetchone())


def update_refund(refund_id: str, patch: dict) -> dict | None:
    if not patch:
        return get_refund_by_id(refund_id)
    allowed = {"status", "reviewed_by", "reviewed_at"}
    safe = {k: v for k, v in patch.items() if k in allowed}
    if not safe:
        return get_refund_by_id(refund_id)
    sets = ", ".join(f"{k} = %s" for k in safe)
    vals = list(safe.values()) + [refund_id]
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE refunds SET {sets} WHERE id = %s RETURNING *", vals
            )
            return _row(cur.fetchone())


# ---------------------------------------------------------------------------
# Milestone operations
# ---------------------------------------------------------------------------

def get_milestones_by_campaign(campaign_id: str) -> list:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM milestones WHERE campaign_id = %s ORDER BY created_at DESC",
                (campaign_id,),
            )
            return _rows(cur.fetchall())


def create_milestone(data: dict) -> dict:
    mid = _new_id()
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO milestones (id, campaign_id, fundraiser_id, title, description)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *
            """, (
                mid,
                data["campaign_id"],
                data["fundraiser_id"],
                data["title"],
                data.get("description", ""),
            ))
            return _row(cur.fetchone())


# ---------------------------------------------------------------------------
# Fraud report operations
# ---------------------------------------------------------------------------

def get_all_fraud_reports() -> list:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM fraud_reports ORDER BY created_at DESC")
            return _rows(cur.fetchall())


def get_fraud_reports_by_campaign(campaign_id: str) -> list:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM fraud_reports WHERE campaign_id = %s", (campaign_id,)
            )
            return _rows(cur.fetchall())


def create_fraud_report(data: dict) -> dict:
    rid = _new_id()
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO fraud_reports (id, campaign_id, reported_by, description, status)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *
            """, (
                rid,
                data["campaign_id"],
                data["reported_by"],
                data["description"],
                data.get("status", "PENDING"),
            ))
            return _row(cur.fetchone())


def update_fraud_report(report_id: str, patch: dict) -> dict | None:
    if not patch:
        return None
    allowed = {"status", "reviewed_by", "escalated_to"}
    safe = {k: v for k, v in patch.items() if k in allowed}
    if not safe:
        return None
    sets = ", ".join(f"{k} = %s" for k in safe)
    vals = list(safe.values()) + [report_id]
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE fraud_reports SET {sets} WHERE id = %s RETURNING *", vals
            )
            return _row(cur.fetchone())


# ---------------------------------------------------------------------------
# Identity verification operations
# ---------------------------------------------------------------------------

def get_verification_by_campaign(campaign_id: str) -> dict | None:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM identity_verifications WHERE campaign_id = %s", (campaign_id,)
            )
            return _row(cur.fetchone())


def create_verification(data: dict) -> dict:
    vid = _new_id()
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO identity_verifications
                    (id, campaign_id, fundraiser_id, status, documents, notes)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                vid,
                data["campaign_id"],
                data["fundraiser_id"],
                data.get("status", "PENDING"),
                data.get("documents", []),
                data.get("notes", ""),
            ))
            return _row(cur.fetchone())


def update_verification(v_id: str, patch: dict) -> dict | None:
    if not patch:
        return None
    allowed = {"status", "verified_by", "documents", "notes"}
    safe = {k: v for k, v in patch.items() if k in allowed}
    if not safe:
        return None
    sets = ", ".join(f"{k} = %s" for k in safe)
    vals = list(safe.values()) + [v_id]
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE identity_verifications SET {sets} WHERE id = %s RETURNING *", vals
            )
            return _row(cur.fetchone())


# ---------------------------------------------------------------------------
# Withdrawal hold operations
# ---------------------------------------------------------------------------

def get_active_hold_by_campaign(campaign_id: str) -> dict | None:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM withdrawal_holds WHERE campaign_id = %s AND status = 'ACTIVE'",
                (campaign_id,),
            )
            return _row(cur.fetchone())


def create_hold(data: dict) -> dict:
    hid = _new_id()
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO withdrawal_holds (id, campaign_id, placed_by, reason, status)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *
            """, (
                hid,
                data["campaign_id"],
                data["placed_by"],
                data["reason"],
                data.get("status", "ACTIVE"),
            ))
            return _row(cur.fetchone())


def update_hold(hold_id: str, patch: dict) -> dict | None:
    if not patch:
        return None
    allowed = {"status"}
    safe = {k: v for k, v in patch.items() if k in allowed}
    if not safe:
        return None
    sets = ", ".join(f"{k} = %s" for k in safe)
    vals = list(safe.values()) + [hold_id]
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE withdrawal_holds SET {sets} WHERE id = %s RETURNING *", vals
            )
            return _row(cur.fetchone())


# ---------------------------------------------------------------------------
# Favorite operations
# ---------------------------------------------------------------------------

def get_favorites_by_donee(donee_id: str) -> list:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM favorites WHERE donee_id = %s", (donee_id,)
            )
            return _rows(cur.fetchall())


def get_favorites_by_campaign(campaign_id: str) -> list:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM favorites WHERE campaign_id = %s", (campaign_id,)
            )
            return _rows(cur.fetchall())


def get_favorite(donee_id: str, campaign_id: str) -> dict | None:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM favorites WHERE donee_id = %s AND campaign_id = %s",
                (donee_id, campaign_id),
            )
            return _row(cur.fetchone())


def create_favorite(donee_id: str, campaign_id: str) -> dict:
    fid = _new_id()
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO favorites (id, donee_id, campaign_id)
                VALUES (%s, %s, %s)
                RETURNING *
            """, (fid, donee_id, campaign_id))
            return _row(cur.fetchone())


def delete_favorite(fav_id: str) -> dict | None:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM favorites WHERE id = %s RETURNING *", (fav_id,))
            return _row(cur.fetchone())


# ---------------------------------------------------------------------------
# Notification operations
# ---------------------------------------------------------------------------

def get_notifications_by_user(user_id: str) -> list:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM notifications WHERE user_id = %s ORDER BY created_at DESC",
                (user_id,),
            )
            return _rows(cur.fetchall())


def create_notification(data: dict) -> dict:
    nid = _new_id()
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO notifications (id, user_id, title, message, notif_type, read, link)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                nid,
                data["user_id"],
                data["title"],
                data["message"],
                data.get("notif_type", "info"),
                data.get("read", False),
                data.get("link"),
            ))
            return _row(cur.fetchone())


def update_notification(notif_id: str, patch: dict) -> dict | None:
    if not patch:
        return None
    allowed = {"read", "title", "message"}
    safe = {k: v for k, v in patch.items() if k in allowed}
    if not safe:
        return None
    sets = ", ".join(f"{k} = %s" for k in safe)
    vals = list(safe.values()) + [notif_id]
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE notifications SET {sets} WHERE id = %s RETURNING *", vals
            )
            return _row(cur.fetchone())


# ---------------------------------------------------------------------------
# Session operations
# ---------------------------------------------------------------------------

def create_session(user_id: str) -> str:
    import secrets
    token = secrets.token_hex(32)
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO sessions (token, user_id) VALUES (%s, %s)",
                (token, user_id),
            )
    return token


def get_user_id_by_token(token: str) -> str | None:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM sessions WHERE token = %s", (token,))
            row = cur.fetchone()
            return row["user_id"] if row else None


def delete_session(token: str) -> None:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM sessions WHERE token = %s", (token,))


# ---------------------------------------------------------------------------
# Config operations
# ---------------------------------------------------------------------------

def get_config() -> dict:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT key, value FROM platform_config")
            return {row["key"]: float(row["value"]) for row in cur.fetchall()}


def set_config_value(key: str, value) -> dict:
    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO platform_config (key, value, updated_at)
                VALUES (%s, %s, NOW())
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
            """, (key, value))
    return get_config()
