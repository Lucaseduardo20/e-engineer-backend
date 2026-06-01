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
    entityType?: string;
    entityId?: string;
  }): Promise<Paginated<AuditLogEntry>> {
    const where: Record<string, unknown> = { organizationId: input.organizationId };
    if (input.entityType) where.entityType = input.entityType;
    if (input.entityId) where.entityId = input.entityId;
    const [items, total] = await this.activityLogs.findAndCount({
      where,
      order: { occurredAt: 'DESC' },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        actorId: item.actorId,
        actorDisplayName: item.actorDisplayName,
        actorName: item.actorName,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        description: item.description,
        metadata: item.metadata ?? {},
        occurredAt: item.occurredAt.toISOString(),
      })),
      total,
      page: input.page,
      pageSize: input.pageSize,
    };
  }

  async record(input: {
    organizationId: string;
    actorId?: string | null;
    actorDisplayName?: string | null;
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
      actorId: input.actorId ?? null,
      actorDisplayName: input.actorDisplayName ?? input.actorName,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      description: input.description,
      metadata: input.metadata ?? {},
      occurredAt: new Date(),
    });
  }
}
