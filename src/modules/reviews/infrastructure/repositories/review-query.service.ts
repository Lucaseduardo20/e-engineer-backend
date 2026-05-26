import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  Paginated,
  ReviewSummary,
} from '../../../../shared/contracts/dashboard.contracts';
import { ReviewOrmEntity } from '../persistence/typeorm/review.orm-entity';

@Injectable()
export class ReviewQueryService {
  constructor(
    @InjectRepository(ReviewOrmEntity)
    private readonly reviews: Repository<ReviewOrmEntity>,
  ) {}

  async list(input: {
    organizationId: string;
    page: number;
    pageSize: number;
  }): Promise<Paginated<ReviewSummary>> {
    const [items, total] = await this.reviews.findAndCount({
      where: { organizationId: input.organizationId },
      order: { dueDate: 'ASC', updatedAt: 'DESC' },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        projectId: item.projectId,
        deliverableId: item.deliverableId,
        status: item.status,
        requestedBy: item.requestedBy,
        reviewedBy: item.reviewedBy,
        dueDate: item.dueDate,
        comment: item.comment,
      })),
      total,
      page: input.page,
      pageSize: input.pageSize,
    };
  }
}
