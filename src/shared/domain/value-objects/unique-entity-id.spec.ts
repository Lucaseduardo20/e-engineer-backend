import { UniqueEntityId } from './unique-entity-id';

describe('UniqueEntityId', () => {
  it('generates a valid id when no value is provided', () => {
    const id = new UniqueEntityId();

    expect(id.toString()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('rejects invalid ids', () => {
    expect(() => new UniqueEntityId('invalid-id')).toThrow(
      'Invalid unique entity id: invalid-id',
    );
  });
});
