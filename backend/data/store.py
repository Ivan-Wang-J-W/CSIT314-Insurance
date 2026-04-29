"""
In-memory data store.

To migrate to a real database (e.g. PostgreSQL via SQLAlchemy):
  1. pip install flask-sqlalchemy psycopg2-binary
  2. Define SQLAlchemy models (see commented examples beside each operation)
  3. Replace every in-memory function body with its commented DB equivalent
  4. Remove _store and the helper functions at the bottom of this file
"""

import uuid
from datetime import datetime

# --- DB: uncomment when database is ready ---
# from flask_sqlalchemy import SQLAlchemy
# db = SQLAlchemy()
# --------------------------------------------

_store: dict = {
    "users": {},
    "campaigns": {},
    "donations": {},
    "milestones": {},
    "fraud_reports": {},
    "notifications": {},
    "identity_verifications": {},
    "withdrawal_holds": {},
    "favorites": {},
    "sessions": {},
    "config": {
        "max_campaign_goal": 1_000_000,
        "min_campaign_duration_days": 7,
        "platform_fee_percent": 5,
    },
}


def _new_id() -> str:
    return str(uuid.uuid4())[:8]


def _now() -> str:
    return datetime.utcnow().isoformat()


def reset_store() -> None:
    """Reset all collections to empty (used between tests)."""
    for key in list(_store.keys()):
        if key == "config":
            _store[key] = {
                "max_campaign_goal": 1_000_000,
                "min_campaign_duration_days": 7,
                "platform_fee_percent": 5,
            }
        else:
            _store[key] = {}


# ---------------------------------------------------------------------------
# User operations
# ---------------------------------------------------------------------------

def get_all_users() -> list:
    # DB: return UserModel.query.all()
    return list(_store["users"].values())


def get_user_by_id(user_id: str) -> dict | None:
    # DB: return db.session.get(UserModel, user_id)
    return _store["users"].get(user_id)


def get_user_by_username(username: str) -> dict | None:
    # DB: return UserModel.query.filter_by(username=username).first()
    for u in _store["users"].values():
        if u["username"] == username:
            return u
    return None


def get_user_by_email(email: str) -> dict | None:
    # DB: return UserModel.query.filter_by(email=email).first()
    for u in _store["users"].values():
        if u["email"] == email:
            return u
    return None


def create_user(data: dict) -> dict:
    # DB: user = UserModel(**data); db.session.add(user); db.session.commit()
    uid = _new_id()
    user = {**data, "id": uid, "created_at": _now()}
    _store["users"][uid] = user
    return user


def update_user(user_id: str, patch: dict) -> dict | None:
    # DB: UserModel.query.filter_by(id=user_id).update(patch); db.session.commit()
    if user_id not in _store["users"]:
        return None
    _store["users"][user_id].update(patch)
    return _store["users"][user_id]


def delete_user(user_id: str) -> dict | None:
    # DB: user = db.session.get(UserModel, user_id); db.session.delete(user); db.session.commit()
    return _store["users"].pop(user_id, None)


# ---------------------------------------------------------------------------
# Campaign operations
# ---------------------------------------------------------------------------

def get_all_campaigns() -> list:
    # DB: return CampaignModel.query.all()
    return list(_store["campaigns"].values())


def get_campaign_by_id(campaign_id: str) -> dict | None:
    # DB: return db.session.get(CampaignModel, campaign_id)
    return _store["campaigns"].get(campaign_id)


def create_campaign(data: dict) -> dict:
    # DB: c = CampaignModel(**data); db.session.add(c); db.session.commit()
    cid = _new_id()
    campaign = {**data, "id": cid, "created_at": _now()}
    _store["campaigns"][cid] = campaign
    return campaign


def update_campaign(campaign_id: str, patch: dict) -> dict | None:
    # DB: CampaignModel.query.filter_by(id=campaign_id).update(patch); db.session.commit()
    if campaign_id not in _store["campaigns"]:
        return None
    _store["campaigns"][campaign_id].update(patch)
    return _store["campaigns"][campaign_id]


def delete_campaign(campaign_id: str) -> dict | None:
    # DB: c = db.session.get(CampaignModel, campaign_id); db.session.delete(c); db.session.commit()
    return _store["campaigns"].pop(campaign_id, None)


# ---------------------------------------------------------------------------
# Donation operations
# ---------------------------------------------------------------------------

def get_all_donations() -> list:
    # DB: return DonationModel.query.all()
    return list(_store["donations"].values())


def get_donations_by_campaign(campaign_id: str) -> list:
    # DB: return DonationModel.query.filter_by(campaign_id=campaign_id).all()
    return [d for d in _store["donations"].values() if d["campaign_id"] == campaign_id]


def get_donations_by_donee(donee_id: str) -> list:
    # DB: return DonationModel.query.filter_by(donee_id=donee_id).all()
    return [d for d in _store["donations"].values() if d["donee_id"] == donee_id]


def create_donation(data: dict) -> dict:
    # DB: d = DonationModel(**data); db.session.add(d); db.session.commit()
    did = _new_id()
    donation = {**data, "id": did, "created_at": _now()}
    _store["donations"][did] = donation
    return donation


# ---------------------------------------------------------------------------
# Milestone operations
# ---------------------------------------------------------------------------

def get_milestones_by_campaign(campaign_id: str) -> list:
    # DB: return MilestoneModel.query.filter_by(campaign_id=campaign_id).order_by(MilestoneModel.created_at.desc()).all()
    results = [m for m in _store["milestones"].values() if m["campaign_id"] == campaign_id]
    return sorted(results, key=lambda m: m["created_at"], reverse=True)


def create_milestone(data: dict) -> dict:
    # DB: m = MilestoneModel(**data); db.session.add(m); db.session.commit()
    mid = _new_id()
    milestone = {**data, "id": mid, "created_at": _now()}
    _store["milestones"][mid] = milestone
    return milestone


# ---------------------------------------------------------------------------
# Fraud report operations
# ---------------------------------------------------------------------------

def get_all_fraud_reports() -> list:
    # DB: return FraudReportModel.query.all()
    return list(_store["fraud_reports"].values())


def get_fraud_reports_by_campaign(campaign_id: str) -> list:
    # DB: return FraudReportModel.query.filter_by(campaign_id=campaign_id).all()
    return [r for r in _store["fraud_reports"].values() if r["campaign_id"] == campaign_id]


def create_fraud_report(data: dict) -> dict:
    # DB: r = FraudReportModel(**data); db.session.add(r); db.session.commit()
    rid = _new_id()
    report = {**data, "id": rid, "created_at": _now()}
    _store["fraud_reports"][rid] = report
    return report


def update_fraud_report(report_id: str, patch: dict) -> dict | None:
    # DB: FraudReportModel.query.filter_by(id=report_id).update(patch); db.session.commit()
    if report_id not in _store["fraud_reports"]:
        return None
    _store["fraud_reports"][report_id].update(patch)
    return _store["fraud_reports"][report_id]


# ---------------------------------------------------------------------------
# Identity verification operations
# ---------------------------------------------------------------------------

def get_verification_by_campaign(campaign_id: str) -> dict | None:
    # DB: return IdentityVerificationModel.query.filter_by(campaign_id=campaign_id).first()
    for v in _store["identity_verifications"].values():
        if v["campaign_id"] == campaign_id:
            return v
    return None


def create_verification(data: dict) -> dict:
    # DB: v = IdentityVerificationModel(**data); db.session.add(v); db.session.commit()
    vid = _new_id()
    verification = {**data, "id": vid, "created_at": _now()}
    _store["identity_verifications"][vid] = verification
    return verification


def update_verification(v_id: str, patch: dict) -> dict | None:
    # DB: IdentityVerificationModel.query.filter_by(id=v_id).update(patch); db.session.commit()
    if v_id not in _store["identity_verifications"]:
        return None
    _store["identity_verifications"][v_id].update(patch)
    return _store["identity_verifications"][v_id]


# ---------------------------------------------------------------------------
# Withdrawal hold operations
# ---------------------------------------------------------------------------

def get_active_hold_by_campaign(campaign_id: str) -> dict | None:
    # DB: return WithdrawalHoldModel.query.filter_by(campaign_id=campaign_id, status='ACTIVE').first()
    for h in _store["withdrawal_holds"].values():
        if h["campaign_id"] == campaign_id and h["status"] == "ACTIVE":
            return h
    return None


def create_hold(data: dict) -> dict:
    # DB: h = WithdrawalHoldModel(**data); db.session.add(h); db.session.commit()
    hid = _new_id()
    hold = {**data, "id": hid, "created_at": _now()}
    _store["withdrawal_holds"][hid] = hold
    return hold


def update_hold(hold_id: str, patch: dict) -> dict | None:
    # DB: WithdrawalHoldModel.query.filter_by(id=hold_id).update(patch); db.session.commit()
    if hold_id not in _store["withdrawal_holds"]:
        return None
    _store["withdrawal_holds"][hold_id].update(patch)
    return _store["withdrawal_holds"][hold_id]


# ---------------------------------------------------------------------------
# Favorite operations
# ---------------------------------------------------------------------------

def get_favorites_by_donee(donee_id: str) -> list:
    # DB: return FavoriteModel.query.filter_by(donee_id=donee_id).all()
    return [f for f in _store["favorites"].values() if f["donee_id"] == donee_id]


def get_favorites_by_campaign(campaign_id: str) -> list:
    # DB: return FavoriteModel.query.filter_by(campaign_id=campaign_id).all()
    return [f for f in _store["favorites"].values() if f["campaign_id"] == campaign_id]


def get_favorite(donee_id: str, campaign_id: str) -> dict | None:
    # DB: return FavoriteModel.query.filter_by(donee_id=donee_id, campaign_id=campaign_id).first()
    for f in _store["favorites"].values():
        if f["donee_id"] == donee_id and f["campaign_id"] == campaign_id:
            return f
    return None


def create_favorite(donee_id: str, campaign_id: str) -> dict:
    # DB: f = FavoriteModel(donee_id=donee_id, campaign_id=campaign_id); db.session.add(f); db.session.commit()
    fid = _new_id()
    fav = {"id": fid, "donee_id": donee_id, "campaign_id": campaign_id, "created_at": _now()}
    _store["favorites"][fid] = fav
    return fav


def delete_favorite(fav_id: str) -> dict | None:
    # DB: f = db.session.get(FavoriteModel, fav_id); db.session.delete(f); db.session.commit()
    return _store["favorites"].pop(fav_id, None)


# ---------------------------------------------------------------------------
# Notification operations
# ---------------------------------------------------------------------------

def get_notifications_by_user(user_id: str) -> list:
    # DB: return NotificationModel.query.filter_by(user_id=user_id).order_by(NotificationModel.created_at.desc()).all()
    results = [n for n in _store["notifications"].values() if n["user_id"] == user_id]
    return sorted(results, key=lambda n: n["created_at"], reverse=True)


def create_notification(data: dict) -> dict:
    # DB: n = NotificationModel(**data); db.session.add(n); db.session.commit()
    nid = _new_id()
    notif = {**data, "id": nid, "created_at": _now()}
    _store["notifications"][nid] = notif
    return notif


def update_notification(notif_id: str, patch: dict) -> dict | None:
    # DB: NotificationModel.query.filter_by(id=notif_id).update(patch); db.session.commit()
    if notif_id not in _store["notifications"]:
        return None
    _store["notifications"][notif_id].update(patch)
    return _store["notifications"][notif_id]


# ---------------------------------------------------------------------------
# Session operations
# ---------------------------------------------------------------------------

def create_session(user_id: str) -> str:
    # DB: token = str(uuid.uuid4()); s = SessionModel(token=token, user_id=user_id); db.session.add(s); db.session.commit()
    token = str(uuid.uuid4())
    _store["sessions"][token] = user_id
    return token


def get_user_id_by_token(token: str) -> str | None:
    # DB: s = SessionModel.query.filter_by(token=token).first(); return s.user_id if s else None
    return _store["sessions"].get(token)


def delete_session(token: str) -> None:
    # DB: SessionModel.query.filter_by(token=token).delete(); db.session.commit()
    _store["sessions"].pop(token, None)


# ---------------------------------------------------------------------------
# Config operations
# ---------------------------------------------------------------------------

def get_config() -> dict:
    # DB: return {c.key: c.value for c in ConfigModel.query.all()}
    return dict(_store["config"])


def set_config_value(key: str, value) -> dict:
    # DB: c = ConfigModel.query.filter_by(key=key).first(); c.value = value; db.session.commit()
    _store["config"][key] = value
    return dict(_store["config"])
