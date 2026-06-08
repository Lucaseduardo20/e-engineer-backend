import { Inject, Injectable } from '@nestjs/common';
import type { Paginated } from '../../../../shared/contracts/dashboard.contracts';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { TECHNICAL_TAG_REPOSITORY, type TechnicalTagRepository, type TechnicalTagResponse } from '../../domain/repositories/technical-tag.repository';
import type { TechnicalTagCategoryValue } from '../../domain/value-objects/technical-tag-category.vo';
import type { TechnicalTagStatusValue } from '../../domain/value-objects/technical-tag-status.vo';
import { TechnicalTagResponseMapper } from '../../infrastructure/mappers/technical-tag-response.mapper';

@Injectable()
export class ListTechnicalTagsUseCase {
  constructor(
    @Inject(TECHNICAL_TAG_REPOSITORY)
    private readonly repository: TechnicalTagRepository,
  ) {}

  async execute(input: {
    organizationId: string;
    search?: string;
    category?: TechnicalTagCategoryValue;
    status?: TechnicalTagStatusValue;
    includeArchived?: boolean;
    page: number;
    limit: number;
  }): Promise<Paginated<TechnicalTagResponse>> {
    const [items, total] = await Promise.all([
      this.repository.findMany(input),
      this.repository.count(input),
    ]);
    const usageCounts = await this.repository.countUsageByTagIds(
      items.map((item) => item.id),
      OrganizationId.create(input.organizationId),
    );

    return {
      items: items.map((item) => TechnicalTagResponseMapper.toResponse(item, usageCounts.get(item.id) ?? 0)),
      page: input.page,
      pageSize: input.limit,
      total,
    };
  }
}
