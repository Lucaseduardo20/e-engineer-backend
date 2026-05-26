import {
  Body,
  BadRequestException,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../shared/infrastructure/auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case';
import { CreateProjectRequestDto } from '../dto/create-project.request.dto';
import { CreateProjectOutputDto } from '../../application/dto/create-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly createProjectUseCase: CreateProjectUseCase) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() body: CreateProjectRequestDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<CreateProjectOutputDto> {
    const result = await this.createProjectUseCase.execute({
      ...body,
      organizationId: request.user.organizationId,
    });

    if (result.isFail()) {
      throw new BadRequestException(result.unwrapError().message);
    }

    return result.unwrap();
  }
}
