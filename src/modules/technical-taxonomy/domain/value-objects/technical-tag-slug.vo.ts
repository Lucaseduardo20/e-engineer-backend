import { ValueObject } from '../../../../shared/domain/value-objects/value-object';

export class TechnicalTagSlug extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  static normalize(input: string): string {
    return input
      .trim()
      .replace(/\./g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  static create(input: string): TechnicalTagSlug {
    const slug = this.normalize(input);
    if (!slug) {
      throw new Error('Technical tag slug is required.');
    }
    if (slug.length > 120) {
      throw new Error('Technical tag slug is too long.');
    }
    return new TechnicalTagSlug(slug);
  }

  get value(): string {
    return this.props.value;
  }
}
