import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../domain/repositories/user.repository';
import { TOKEN_SERVICE, type TokenService } from '../ports/token-service';
import { LoginInputDto } from '../dto/login-input.dto';
import { LoginOutputDto } from '../dto/login-output.dto';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginInputDto): Promise<Result<LoginOutputDto, Error>> {
    try {
      const email = input.email.trim().toLowerCase();
      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        return Result.fail(new InvalidCredentialsError());
      }

      const passwordMatches = await user.verifyPassword(input.password);

      if (!passwordMatches) {
        return Result.fail(new InvalidCredentialsError());
      }

      user.markLoggedIn();
      await this.userRepository.save(user);

      const token = this.tokenService.generateToken(
        user.id,
        user.organizationId.toString(),
      );

      console.log(user);

      return Result.ok({
        token,
        user: {
          id: user.id,
          email: user.email.toString(),
          name: user.name,
          organizationId: user.organizationId.toString(),
        },
      });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
