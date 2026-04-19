/**
 * Category Entity
 * Used to classify FSAs (e.g. Medical, Education, Emergency).
 * Categories are CRUD-managed by Platform Managers.
 */
export class Category {
  constructor({
    id,
    name,
    description = '',
    icon = '',
    active = true,
    createdAt = new Date().toISOString(),
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.icon = icon;
    this.active = active;
    this.createdAt = createdAt;
  }

  static fromJSON(raw) {
    return new Category(raw);
  }
}
