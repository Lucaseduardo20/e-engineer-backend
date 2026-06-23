import { randomUUID } from 'crypto';
import { DomainEventPublisher } from '../../../../shared/application/ports/domain-event-publisher';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { User } from '../../domain/entities/user';
import { UserRepository } from '../../domain/repositories/user.repository';
import { CreateUserUseCase } from './create-user.use-case';

class InMemoryUserRepository implements UserRepository {
  readonly users: User[] = [];

  save(user: User): Promise<void> {
    this.users.push(user);
    return Promise.resolve();
  }

  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(
      this.users.find((user) => user.email.toString() === email) ?? null,
    );
  }

  findByIdGlobal(): Promise<User | null> {
    return Promise.resolve(null);
  }

  findById(): Promise<User | null> {
    return Promise.resolve(null);
  }

  getMembershipRoles(): Promise<string[]> {
    return Promise.resolve([]);
  }

  findByOrganizationId(): Promise<User[]> {
    return Promise.resolve([]);
  }
}

describe('CreateUserUseCase', () => {
  let userRepository: InMemoryUserRepository;
  let domainEventPublisher: jest.Mocked<DomainEventPublisher>;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    domainEventPublisher = {
      publish: jest.fn(),
      publishAll: jest.fn(),
      register: jest.fn(),
    };
    useCase = new CreateUserUseCase(userRepository, domainEventPublisher);
  });

  it('creates an organization-scoped user and publishes its event', async () => {
    const organizationId = randomUUID();

    const result = await useCase.execute({
      organizationId,
      email: 'admin@company.com',
      password: 'SecurePass123',
      name: 'Admin User',
    });

    expect(result.isOk()).toBe(true);
    expect(userRepository.users).toHaveLength(1);
    expect(domainEventPublisher.publishAll.mock.calls[0][0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventName: 'UserCreated',
          organizationId,
        }),
      ]),
    );
    expect(result.unwrap()).toMatchObject({
      organizationId,
      email: 'admin@company.com',
      name: 'Admin User',
    });
  });

  it('rejects duplicated emails for the MVP global login model', async () => {
    const organizationId = OrganizationId.new();
    await userRepository.save(
      User.create({
        organizationId,
        email: 'admin@company.com',
        password: 'SecurePass123',
        name: 'Admin User',
      }),
    );

    const result = await useCase.execute({
      organizationId: randomUUID(),
      email: 'admin@company.com',
      password: 'SecurePass123',
      name: 'Another Admin',
    });

    expect(result.isFail()).toBe(true);
    expect(result.unwrapError().message).toBe(
      'User with email admin@company.com already exists.',
    );
  });
});
