import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { TECHNICAL_TAG_REPOSITORY, type TechnicalTagRepository, type TechnicalTagResponse } from '../../domain/repositories/technical-tag.repository';
import { TechnicalTagResponseMapper } from '../../infrastructure/mappers/technical-tag-response.mapper';

@Injectable()
export class ArchiveTechnicalTagUseCase {
  constructor(@Inject(TECHNICAL_TAG_REPOSITORY) private readonly repository: TechnicalTagRepository) {}

  async execute(input: { organizationId: string; id: string; archivedBy: string }): Promise<Result<TechnicalTagResponse, Error>> {
    try {
      const tag = await this.repository.findById(new UniqueEntityId(input.id), OrganizationId.create(input.organizationId));
      if (!tag) throw new Error('Technical tag not found.');
      tag.archive(input.archivedBy);
      await this.repository.save(tag);
      return Result.ok(TechnicalTagResponseMapper.toResponse(tag));
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
