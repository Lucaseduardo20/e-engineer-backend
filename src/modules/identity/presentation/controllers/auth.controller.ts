import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LoginRequestDto } from '../dto/login.request.dto';
import { LoginResponseDto } from '../dto/login.response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post('login')
  async login(@Body() body: LoginRequestDto): Promise<LoginResponseDto> {
    const result = await this.loginUseCase.execute(body);

    if (result.isFail()) {
      throw new UnauthorizedException(result.unwrapError().message);
    }

    return result.unwrap();
  }
}
