import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  ok,
  type ApiResponse,
} from '../../../../shared/presentation/api-response';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LoginRequestDto } from '../dto/login.request.dto';
import { LoginResponseDto } from '../dto/login.response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

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
}
