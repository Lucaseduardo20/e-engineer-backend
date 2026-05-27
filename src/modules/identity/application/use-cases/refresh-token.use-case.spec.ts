import { TokenService } from '../ports/token-service';
import { RefreshTokenUseCase } from './refresh-token.use-case';

describe('RefreshTokenUseCase', () => {
  let tokenService: jest.Mocked<TokenService>;
  let useCase: RefreshTokenUseCase;

  beforeEach(() => {
    tokenService = {
      generateToken: jest.fn().mockReturnValue('signed-token'),
      refreshToken: jest.fn().mockReturnValue('refreshed-token'),
    };
    useCase = new RefreshTokenUseCase(tokenService);
  });

  it('renews a valid token', async () => {
    const result = await useCase.execute({ token: ' signed-token ' });

    expect(result.isOk()).toBe(true);
    expect(tokenService.refreshToken).toHaveBeenCalledWith('signed-token');
    expect(result.unwrap()).toEqual({ token: 'refreshed-token' });
  });

  it('rejects missing tokens', async () => {
    const result = await useCase.execute({ token: ' ' });

    expect(result.isFail()).toBe(true);
    expect(tokenService.refreshToken).not.toHaveBeenCalled();
    expect(result.unwrapError().message).toBe('Token is required.');
  });

  it('rejects invalid tokens', async () => {
    tokenService.refreshToken.mockImplementation(() => {
      throw new Error('Invalid signature.');
    });

    const result = await useCase.execute({ token: 'invalid-token' });

    expect(result.isFail()).toBe(true);
    expect(result.unwrapError().message).toBe('Invalid token.');
  });
});
