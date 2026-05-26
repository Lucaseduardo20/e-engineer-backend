import { randomUUID } from 'crypto';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { User } from '../../domain/entities/user';
import { UserRepository } from '../../domain/repositories/user.repository';
import { TokenService } from '../ports/token-service';
import { LoginUseCase } from './login.use-case';

class InMemoryUserRepository implements UserRepository {
  readonly users: User[] = [];

  save(user: User): Promise<void> {
    const index = this.users.findIndex((item) => item.id === user.id);

    if (index >= 0) {
      this.users[index] = user;
    } else {
      this.users.push(user);
    }

    return Promise.resolve();
  }

  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(
      this.users.find((user) => user.email.toString() === email) ?? null,
    );
  }

  findById(): Promise<User | null> {
    return Promise.resolve(null);
  }

  findByOrganizationId(): Promise<User[]> {
    return Promise.resolve([]);
  }
}

describe('LoginUseCase', () => {
  let userRepository: InMemoryUserRepository;
  let tokenService: jest.Mocked<TokenService>;
  let useCase: LoginUseCase;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    tokenService = {
      generateToken: jest.fn().mockReturnValue('signed-token'),
      refreshToken: jest.fn().mockReturnValue('refreshed-token'),
    };
    useCase = new LoginUseCase(userRepository, tokenService);
  });

  it('authenticates a user and returns token plus user data', async () => {
    const organizationId = randomUUID();
    const user = User.create({
      organizationId: OrganizationId.create(organizationId),
      email: 'admin@company.com',
      password: 'SecurePass123',
      name: 'Admin User',
    });
    await userRepository.save(user);

    const result = await useCase.execute({
      email: 'ADMIN@company.com',
      password: 'SecurePass123',
    });

    expect(result.isOk()).toBe(true);
    expect(tokenService.generateToken.mock.calls[0]).toEqual([
      user.id,
      organizationId,
    ]);
    expect(result.unwrap()).toMatchObject({
      token: 'signed-token',
      user: {
        id: user.id,
        email: 'admin@company.com',
        fullName: 'Admin User',
        organizationId,
      },
    });
    expect(user.lastLoginAt).toBeInstanceOf(Date);
  });

  it('rejects unknown users without exposing lookup details', async () => {
    const result = await useCase.execute({
      email: 'missing@company.com',
      password: 'SecurePass123',
    });

    expect(result.isFail()).toBe(true);
    expect(result.unwrapError().message).toBe('Invalid email or password.');
  });

  it('rejects invalid passwords without exposing lookup details', async () => {
    const user = User.create({
      organizationId: OrganizationId.new(),
      email: 'admin@company.com',
      password: 'SecurePass123',
      name: 'Admin User',
    });
    await userRepository.save(user);

    const result = await useCase.execute({
      email: 'admin@company.com',
      password: 'WrongPass123',
    });

    expect(result.isFail()).toBe(true);
    expect(result.unwrapError().message).toBe('Invalid email or password.');
  });
});
