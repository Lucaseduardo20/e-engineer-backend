import { Inject, Injectable } from '@nestjs/common';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
} from '../../domain/repositories/project.repository';
import type { ProjectTechnicalProfileResponseDto } from '../dto/project-technical-profile.dto';
import { ProjectTechnicalProfileScoreService } from '../services/project-technical-profile-score.service';

@Injectable()
export class GetProjectTechnicalProfileUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    private readonly scoreService: ProjectTechnicalProfileScoreService,
  ) {}

  async execute(input: {
    projectId: string;
    organizationId: string;
  }): Promise<ProjectTechnicalProfileResponseDto | null> {
    const organizationId = OrganizationId.create(input.organizationId);
    const projectId = new UniqueEntityId(input.projectId);
    const project = await this.projectRepository.findById(
      projectId,
      organizationId,
    );

    if (!project) {
      return null;
    }

    const tagSources =
      await this.projectRepository.listTechnicalProfileTagSources(
        projectId,
        organizationId,
      );

    return {
      projectId: project.id,
      organizationId: project.organizationId.toString(),
      scoreExplanation: this.scoreService.explanation,
      tags: this.scoreService.calculate(tagSources),
    };
  }
}
