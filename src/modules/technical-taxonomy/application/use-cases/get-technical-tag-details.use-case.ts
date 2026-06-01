import { Inject, Injectable } from '@nestjs/common';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { TECHNICAL_TAG_REPOSITORY, type TechnicalTagRepository, type TechnicalTagResponse } from '../../domain/repositories/technical-tag.repository';
import { TechnicalTagResponseMapper } from '../../infrastructure/mappers/technical-tag-response.mapper';

@Injectable()
export class GetTechnicalTagDetailsUseCase {
  constructor(
    @Inject(TECHNICAL_TAG_REPOSITORY)
    private readonly repository: TechnicalTagRepository,
  ) {}

  async execute(input: { organizationId: string; id: string }): Promise<TechnicalTagResponse | null> {
    const tag = await this.repository.findById(new UniqueEntityId(input.id), OrganizationId.create(input.organizationId));
    return tag ? TechnicalTagResponseMapper.toResponse(tag) : null;
  }
}
