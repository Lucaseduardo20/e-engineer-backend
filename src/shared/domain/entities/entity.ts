import { UniqueEntityId } from '../value-objects/unique-entity-id';

export abstract class Entity<TProps> {
  protected readonly props: TProps;
  private readonly entityId: UniqueEntityId;

  protected constructor(props: TProps, id?: UniqueEntityId) {
    this.props = props;
    this.entityId = id ?? new UniqueEntityId();
  }

  getId(): UniqueEntityId {
    return this.entityId;
  }

  equals(entity?: Entity<TProps>): boolean {
    if (!entity) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    return this.entityId.equals(entity.getId());
  }
}
