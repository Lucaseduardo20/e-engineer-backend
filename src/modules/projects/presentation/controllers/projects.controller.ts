import { Body, BadRequestException, Controller, Post } from '@nestjs/common';
import { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case';
import { CreateProjectRequestDto } from '../dto/create-project.request.dto';
import { CreateProjectOutputDto } from '../../application/dto/create-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly createProjectUseCase: CreateProjectUseCase) {}

  @Post()
  async create(
    @Body() body: CreateProjectRequestDto,
  ): Promise<CreateProjectOutputDto> {
    const result = await this.createProjectUseCase.execute(body);

    if (result.isFail()) {
      throw new BadRequestException(result.unwrapError().message);
    }

    return result.unwrap();
  }
}
