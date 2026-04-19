/**
 * FSA (Fund Raising Activity) Entity
 * The central entity: each record represents one campaign created by a Fundraiser.
 */
export const FSA_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DRAFT: 'DRAFT',
});

export class FSA {
  constructor({
    id,
    title,
    description,
    categoryId,
    fundraiserId,
    goalAmount,
    raisedAmount = 0,
    imageUrl = '',
    startDate,
    endDate,
    status = FSA_STATUS.ACTIVE,
    views = 0,
    shortlisted = 0,
    createdAt = new Date().toISOString(),
    location = '',
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.categoryId = categoryId;
    this.fundraiserId = fundraiserId;
    this.goalAmount = Number(goalAmount);
    this.raisedAmount = Number(raisedAmount);
    this.imageUrl = imageUrl;
    this.startDate = startDate;
    this.endDate = endDate;
    this.status = status;
    this.views = views;
    this.shortlisted = shortlisted;
    this.createdAt = createdAt;
    this.location = location;
  }

  /** Progress toward the funding goal as a 0–100 percentage. */
  progressPercent() {
    if (!this.goalAmount) return 0;
    return Math.min(100, Math.round((this.raisedAmount / this.goalAmount) * 100));
  }

  isCompleted() {
    return this.status === FSA_STATUS.COMPLETED || this.raisedAmount >= this.goalAmount;
  }

  /** Days remaining until endDate; negative once the campaign has ended. */
  daysRemaining() {
    const now = new Date();
    const end = new Date(this.endDate);
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  }

  static fromJSON(raw) { return new FSA(raw); }
}
