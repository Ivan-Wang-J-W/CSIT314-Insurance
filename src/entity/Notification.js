/**
 * Notification Entity
 * An in-app alert targeted to a specific user.
 */
export const NOTIFICATION_TYPE = Object.freeze({
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
});

export class Notification {
  constructor({
    id,
    userId,
    title,
    message,
    type = NOTIFICATION_TYPE.INFO,
    read = false,
    createdAt = new Date().toISOString(),
    link = '',
  }) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.message = message;
    this.type = type;
    this.read = read;
    this.createdAt = createdAt;
    this.link = link;
  }

  static fromJSON(raw) {
    return new Notification(raw);
  }
}
