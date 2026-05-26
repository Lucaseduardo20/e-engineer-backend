import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  Deliverable,
  Paginated,
} from '../../../../shared/contracts/dashboard.contracts';
import { mapDeliverableStatus } from '../../../../shared/presentation/status-mappers';
import { DeliverableOrmEntity } from '../persistence/typeorm/deliverable.orm-entity';

@Injectable()
export class DeliverableQueryService {
  constructor(
    @InjectRepository(DeliverableOrmEntity)
    private readonly deliverables: Repository<DeliverableOrmEntity>,
  ) {}

  async list(input: {
    organizationId: string;
    projectId?: string;
    page: number;
    pageSize: number;
  }): Promise<Paginated<Deliverable>> {
    const [items, total] = await this.deliverables.findAndCount({
      where: {
        organizationId: input.organizationId,
        ...(input.projectId ? { projectId: input.projectId } : {}),
      },
      order: { dueDate: 'ASC', name: 'ASC' },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        projectId: item.projectId,
        title: item.name,
        dueDate: item.dueDate ?? undefined,
        status: mapDeliverableStatus(item.status),
        assignees: item.responsibleName ? [item.responsibleName] : [],
        attachments: [],
      })),
      total,
      page: input.page,
      pageSize: input.pageSize,
    };
  }
}
