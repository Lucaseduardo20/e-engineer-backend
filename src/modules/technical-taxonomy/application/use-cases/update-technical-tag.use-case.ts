import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { TECHNICAL_TAG_REPOSITORY, type TechnicalTagRepository, type TechnicalTagResponse } from '../../domain/repositories/technical-tag.repository';
import { TechnicalTagCategory } from '../../domain/value-objects/technical-tag-category.vo';
import { TechnicalTagStatus } from '../../domain/value-objects/technical-tag-status.vo';
import { TechnicalTagResponseMapper } from '../../infrastructure/mappers/technical-tag-response.mapper';

@Injectable()
export class UpdateTechnicalTagUseCase {
  constructor(@Inject(TECHNICAL_TAG_REPOSITORY) private readonly repository: TechnicalTagRepository) {}

  async execute(input: {
    organizationId: string;
    id: string;
    updatedBy: string;
    name?: string;
    category?: string;
    description?: string | null;
    status?: string;
  }): Promise<Result<TechnicalTagResponse, Error>> {
    try {
      const organizationId = OrganizationId.create(input.organizationId);
      const tag = await this.repository.findById(new UniqueEntityId(input.id), organizationId);
      if (!tag) throw new Error('Technical tag not found.');

      tag.update({
        name: input.name,
        category: input.category ? TechnicalTagCategory.create(input.category) : undefined,
        description: input.description,
        status: input.status ? TechnicalTagStatus.create(input.status) : undefined,
        updatedBy: input.updatedBy,
      });

      const duplicate = await this.repository.findBySlug(tag.slug, organizationId);
      if (duplicate && duplicate.id !== tag.id) throw new Error('Technical tag already exists for this organization.');

      await this.repository.save(tag);
      return Result.ok(TechnicalTagResponseMapper.toResponse(tag));
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
