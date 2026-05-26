import { DomainError } from '../../../../shared/domain/errors/domain-error';

export class InvalidEmailError extends DomainError {
  constructor() {
    super('Email is invalid.');
  }
}
