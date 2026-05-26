import { randomUUID } from 'crypto';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { User } from './user';

describe('User', () => {
  it('creates a user with normalized email, hashed password and domain event', async () => {
    const organizationId = randomUUID();
    const user = User.create({
      organizationId: OrganizationId.create(organizationId),
      email: '  JOHN@Company.com ',
      password: 'SecurePass123',
      name: ' John Doe ',
    });

    expect(user.email.toString()).toBe('john@company.com');
    expect(user.name).toBe('John Doe');
    expect(user.password.getHash()).not.toBe('SecurePass123');
    await expect(user.verifyPassword('SecurePass123')).resolves.toBe(true);
    await expect(user.verifyPassword('wrong-password')).resolves.toBe(false);
    expect(user.pullDomainEvents()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventName: 'UserCreated',
          organizationId,
        }),
      ]),
    );
  });

  it('rejects invalid email addresses', () => {
    expect(() =>
      User.create({
        organizationId: OrganizationId.new(),
        email: 'invalid',
        password: 'SecurePass123',
        name: 'Jane Doe',
      }),
    ).toThrow('Email is invalid.');
  });

  it('rejects weak passwords', () => {
    expect(() =>
      User.create({
        organizationId: OrganizationId.new(),
        email: 'jane@company.com',
        password: 'weakpass',
        name: 'Jane Doe',
      }),
    ).toThrow('Password is invalid: at least one uppercase letter is required');
  });

  it('rejects empty names', () => {
    expect(() =>
      User.create({
        organizationId: OrganizationId.new(),
        email: 'jane@company.com',
        password: 'SecurePass123',
        name: '   ',
      }),
    ).toThrow('User name is required.');
  });
});
