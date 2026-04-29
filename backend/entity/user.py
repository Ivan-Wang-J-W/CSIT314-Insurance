"""
Users domain entity
"""

ROLES = frozenset({"ADMIN", "FUNDRAISER", "DONEE", "PLATFORM_MANAGER", "ASSESSOR", "COMPLIANCE"})
STATUSES = frozenset({"ACTIVE", "SUSPENDED"})


class User:
    def __init__(self, id, username, email, password_hash, role, full_name,
                 phone="", status="ACTIVE", created_at=None):
        self.id = id
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.role = role
        self.full_name = full_name
        self.phone = phone
        self.status = status
        self.created_at = created_at

    # --- role predicates ---

    def is_admin(self):
        return self.role == "ADMIN"

    def is_fundraiser(self):
        return self.role == "FUNDRAISER"

    def is_donee(self):
        return self.role == "DONEE"

    def is_platform_manager(self):
        return self.role == "PLATFORM_MANAGER"

    def is_assessor(self):
        return self.role == "ASSESSOR"

    def is_compliance(self):
        return self.role == "COMPLIANCE"

    def is_active(self):
        return self.status == "ACTIVE"

    # --- serialisation ---

    def to_dict(self, include_password=False):
        d = {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "full_name": self.full_name,
            "phone": self.phone,
            "status": self.status,
            "created_at": self.created_at,
        }
        if include_password:
            d["password_hash"] = self.password_hash
        return d

    @classmethod
    def from_dict(cls, d):
        return cls(
            id=d["id"],
            username=d["username"],
            email=d["email"],
            password_hash=d.get("password_hash", ""),
            role=d["role"],
            full_name=d.get("full_name", ""),
            phone=d.get("phone", ""),
            status=d.get("status", "ACTIVE"),
            created_at=d.get("created_at"),
        )
