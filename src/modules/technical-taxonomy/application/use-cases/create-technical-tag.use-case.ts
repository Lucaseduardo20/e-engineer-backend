import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { TechnicalTag } from '../../domain/entities/technical-tag';
import { TECHNICAL_TAG_REPOSITORY, type TechnicalTagRepository, type TechnicalTagResponse } from '../../domain/repositories/technical-tag.repository';
import { TechnicalTagCategory } from '../../domain/value-objects/technical-tag-category.vo';
import { TechnicalTagResponseMapper } from '../../infrastructure/mappers/technical-tag-response.mapper';

@Injectable()
export class CreateTechnicalTagUseCase {
  constructor(
    @Inject(TECHNICAL_TAG_REPOSITORY)
    private readonly repository: TechnicalTagRepository,
  ) {}

  async execute(input: {
    organizationId: string;
    name: string;
    category: string;
    description?: string | null;
    createdBy: string;
  }): Promise<Result<TechnicalTagResponse, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const tag = TechnicalTag.create({
        organizationId,
        name: input.name,
        category: TechnicalTagCategory.create(input.category),
        description: input.description,
        createdBy: input.createdBy,
      });

      const exists = await this.repository.existsBySlug(tag.slug, organizationId);
      if (exists) throw new Error('Technical tag already exists for this organization.');

      await this.repository.save(tag);
      return Result.ok(TechnicalTagResponseMapper.toResponse(tag));
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
