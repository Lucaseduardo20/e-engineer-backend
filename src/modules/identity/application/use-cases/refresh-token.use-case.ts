import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { TOKEN_SERVICE, type TokenService } from '../ports/token-service';
import {
  RefreshTokenInputDto,
  RefreshTokenOutputDto,
} from '../dto/refresh-token-input.dto';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute(
    input: RefreshTokenInputDto,
  ): Promise<Result<RefreshTokenOutputDto, Error>> {
    try {
      const token = input.token?.trim();

      if (!token) {
        return Result.fail(new Error('Token is required.'));
      }

      return Result.ok({
        token: this.tokenService.refreshToken(token),
      });
    } catch {
      return Result.fail(new Error('Invalid token.'));
    }
  }
}
