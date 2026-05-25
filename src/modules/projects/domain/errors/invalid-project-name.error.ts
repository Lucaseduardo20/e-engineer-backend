import { DomainError } from '../../../../shared/domain/errors/domain-error';

export class InvalidProjectNameError extends DomainError {
  constructor() {
    super('Project name is required');
  }
}
