import { DomainError } from '../../../../shared/domain/errors/domain-error';

export class InvalidUserNameError extends DomainError {
  constructor() {
    super('User name is required.');
  }
}
