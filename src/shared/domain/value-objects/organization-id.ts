import { UniqueEntityId } from './unique-entity-id';

export class OrganizationId extends UniqueEntityId {
  static create(value: string): OrganizationId {
    return new OrganizationId(value);
  }

  static new(): OrganizationId {
    return new OrganizationId();
  }
}
