import * as bcrypt from 'bcrypt';
import { ValueObject } from '../../../../shared/domain/value-objects/value-object';
import { InvalidPasswordError } from '../errors/invalid-password.error';

export class Password extends ValueObject<{ hash: string }> {
  private static readonly saltRounds = 10;

  private constructor(props: { hash: string }) {
    super(props);
  }

  static create(rawPassword: string): Password {
    Password.validateRawPassword(rawPassword);

    return new Password({
      hash: bcrypt.hashSync(rawPassword, Password.saltRounds),
    });
  }

  static fromHash(hash: string): Password {
    if (!hash.trim()) {
      throw new InvalidPasswordError('hash is required');
    }

    return new Password({ hash });
  }

  async verify(rawPassword: string): Promise<boolean> {
    return bcrypt.compare(rawPassword, this.props.hash);
  }

  getHash(): string {
    return this.props.hash;
  }

  private static validateRawPassword(rawPassword: string): void {
    if (!rawPassword) {
      throw new InvalidPasswordError('password is required');
    }

    if (rawPassword.length < 8) {
      throw new InvalidPasswordError('minimum length is 8 characters');
    }

    if (!/[a-z]/.test(rawPassword)) {
      throw new InvalidPasswordError(
        'at least one lowercase letter is required',
      );
    }

    if (!/[A-Z]/.test(rawPassword)) {
      throw new InvalidPasswordError(
        'at least one uppercase letter is required',
      );
    }

    if (!/[0-9]/.test(rawPassword)) {
      throw new InvalidPasswordError('at least one number is required');
    }
  }
}
