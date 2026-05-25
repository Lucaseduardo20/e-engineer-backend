import { randomUUID } from 'crypto';

export class UniqueEntityId {
  private static readonly uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private readonly value: string;

  constructor(value?: string) {
    const id = value ?? randomUUID();

    if (!UniqueEntityId.uuidPattern.test(id)) {
      throw new Error(`Invalid unique entity id: ${id}`);
    }

    this.value = id;
  }

  toString(): string {
    return this.value;
  }

  equals(id?: UniqueEntityId): boolean {
    if (!id) {
      return false;
    }

    return this.value === id.toString();
  }
}
