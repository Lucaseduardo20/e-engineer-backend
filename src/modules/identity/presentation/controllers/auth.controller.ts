import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  ok,
  type ApiResponse,
} from '../../../../shared/presentation/api-response';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LoginRequestDto } from '../dto/login.request.dto';
import { LoginResponseDto } from '../dto/login.response.dto';
import { RefreshTokenRequestDto } from '../dto/refresh-token.request.dto';
import { RefreshTokenResponseDto } from '../dto/refresh-token.response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  @Post('login')
  @ApiOkResponse({ description: 'Autentica usuario e retorna token JWT.' })
  async login(
    @Body() body: LoginRequestDto,
  ): Promise<ApiResponse<LoginResponseDto>> {
    const result = await this.loginUseCase.execute(body);

    if (result.isFail()) {
      throw new UnauthorizedException(result.unwrapError().message);
    }

    return ok(result.unwrap());
  }

  @Post('refresh')
  @ApiOkResponse({ description: 'Renova um token JWT valido.' })
  async refresh(
    @Body() body: RefreshTokenRequestDto,
  ): Promise<ApiResponse<RefreshTokenResponseDto>> {
    const result = await this.refreshTokenUseCase.execute(body);

    if (result.isFail()) {
      throw new UnauthorizedException(result.unwrapError().message);
    }

    return ok(result.unwrap());
  }
}
