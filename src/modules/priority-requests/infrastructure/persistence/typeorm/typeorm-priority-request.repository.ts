import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationId } from '../../../../../shared/domain/value-objects/organization-id';
import { PriorityRequest } from '../../../domain/entities/priority-request';
import { PriorityRequestRepository } from '../../../domain/repositories/priority-request.repository';
import { PriorityRequestMapper } from '../../mappers/priority-request.mapper';
import { PriorityRequestOrmEntity } from './priority-request.orm-entity';

@Injectable()
export class TypeOrmPriorityRequestRepository implements PriorityRequestRepository {
  constructor(
    @InjectRepository(PriorityRequestOrmEntity)
    private readonly repository: Repository<PriorityRequestOrmEntity>,
  ) {}

  async save(priorityRequest: PriorityRequest): Promise<void> {
    await this.repository.save(PriorityRequestMapper.toOrm(priorityRequest));
  }

  async findById(
    id: string,
    organizationId: OrganizationId,
  ): Promise<PriorityRequest | null> {
    const ormEntity = await this.repository.findOne({
      where: { id, organizationId: organizationId.toString() },
    });

    return ormEntity ? PriorityRequestMapper.toDomain(ormEntity) : null;
  }

  async list(organizationId: OrganizationId): Promise<PriorityRequest[]> {
    const rows = await this.repository.find({
      where: { organizationId: organizationId.toString() },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    return rows.map(PriorityRequestMapper.toDomain);
  }
}
