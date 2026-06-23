import { ValueObject } from '../../../../shared/domain/value-objects/value-object';

export type DocumentStatusValue =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'superseded';

export const documentStatusValues: DocumentStatusValue[] = [
  'draft',
  'in_review',
  'approved',
  'superseded',
];

export class DocumentStatus extends ValueObject<{
  value: DocumentStatusValue;
}> {
  private constructor(value: DocumentStatusValue) {
    super({ value });
  }

  static draft(): DocumentStatus {
    return new DocumentStatus('draft');
  }

  static create(value: string): DocumentStatus {
    if (!documentStatusValues.includes(value as DocumentStatusValue)) {
      throw new Error(`Invalid document status: ${value}`);
    }

    return new DocumentStatus(value as DocumentStatusValue);
  }

  static fromPersistence(value?: string | null): DocumentStatus {
    if (!value) {
      return DocumentStatus.draft();
    }

    if (value === 'official') {
      return new DocumentStatus('approved');
    }

    return DocumentStatus.create(
      documentStatusValues.includes(value as DocumentStatusValue)
        ? value
        : 'draft',
    );
  }

  get value(): DocumentStatusValue {
    return this.props.value;
  }
}
