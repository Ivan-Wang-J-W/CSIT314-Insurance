/**
 * User Entity (BCE: Entity layer)
 * Domain model representing any account in the system.
 *
 * Roles: ADMIN | FUNDRAISER | DONEE | PLATFORM_MANAGER
 */
export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  FUNDRAISER: 'FUNDRAISER',
  DONEE: 'DONEE',
  PLATFORM_MANAGER: 'PLATFORM_MANAGER',
  ASSESSOR: 'ASSESSOR',
  COMPLIANCE: 'COMPLIANCE',
});

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.FUNDRAISER]: 'Fundraiser',
  [ROLES.DONEE]: 'Donee',
  [ROLES.PLATFORM_MANAGER]: 'Platform Manager',
  [ROLES.ASSESSOR]: 'Assessor',
  [ROLES.COMPLIANCE]: 'Compliance Officer',
};

export class User {
  constructor({
    id,
    username,
    email,
    password,
    role,
    fullName = '',
    phone = '',
    avatarUrl = '',
    status = 'ACTIVE',
    createdAt = new Date().toISOString(),
  }) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password;
    this.role = role;
    this.fullName = fullName;
    this.phone = phone;
    this.avatarUrl = avatarUrl;
    this.status = status;
    this.createdAt = createdAt;
  }

  isAdmin() { return this.role === ROLES.ADMIN; }
  isFundraiser() { return this.role === ROLES.FUNDRAISER; }
  isDonee() { return this.role === ROLES.DONEE; }
  isPlatformManager() { return this.role === ROLES.PLATFORM_MANAGER; }

  /** Strip sensitive fields before exposing the object to UI/context. */
  toSafeObject() {
    const { password, ...rest } = this;
    return rest;
  }

  static fromJSON(raw) { return new User(raw); }
}
