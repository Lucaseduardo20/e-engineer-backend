import { DomainError } from '../../../../shared/domain/errors/domain-error';

export class InvalidProjectTypeError extends DomainError {
  constructor() {
    super('Project type is required');
  }
}
