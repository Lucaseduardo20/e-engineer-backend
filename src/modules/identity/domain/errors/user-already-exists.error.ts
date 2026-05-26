import { DomainError } from '../../../../shared/domain/errors/domain-error';

export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`User with email ${email} already exists.`);
  }
}
