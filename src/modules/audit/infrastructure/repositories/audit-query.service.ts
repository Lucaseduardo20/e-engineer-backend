import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  AuditLogEntry,
  Paginated,
} from '../../../../shared/contracts/dashboard.contracts';
import { ActivityLogOrmEntity } from '../persistence/typeorm/activity-log.orm-entity';

@Injectable()
export class AuditQueryService {
  constructor(
    @InjectRepository(ActivityLogOrmEntity)
    private readonly activityLogs: Repository<ActivityLogOrmEntity>,
  ) {}

  async list(input: {
    organizationId: string;
    page: number;
    pageSize: number;
  }): Promise<Paginated<AuditLogEntry>> {
    const [items, total] = await this.activityLogs.findAndCount({
      where: { organizationId: input.organizationId },
      order: { occurredAt: 'DESC' },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        actorName: item.actorName,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        description: item.description,
        occurredAt: item.occurredAt.toISOString(),
      })),
      total,
      page: input.page,
      pageSize: input.pageSize,
    };
  }

  async record(input: {
    organizationId: string;
    actorName: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    description: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.activityLogs.save({
      id: randomUUID(),
      organizationId: input.organizationId,
      actorName: input.actorName,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      description: input.description,
      metadata: input.metadata ?? {},
      occurredAt: new Date(),
    });
  }
}
