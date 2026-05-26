import { ValueObject } from '../../../../shared/domain/value-objects/value-object';
import { InvalidEmailError } from '../errors/invalid-email.error';

export class Email extends ValueObject<{ value: string }> {
  private static readonly pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: { value: string }) {
    super(props);
  }

  static create(value: string): Email {
    const normalized = value.trim().toLowerCase();

    if (!normalized || !Email.pattern.test(normalized)) {
      throw new InvalidEmailError();
    }

    return new Email({ value: normalized });
  }

  toString(): string {
    return this.props.value;
  }
}
