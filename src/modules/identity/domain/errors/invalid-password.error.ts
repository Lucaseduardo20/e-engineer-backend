import { DomainError } from '../../../../shared/domain/errors/domain-error';

export class InvalidPasswordError extends DomainError {
  constructor(reason: string) {
    super(`Password is invalid: ${reason}`);
  }
}
