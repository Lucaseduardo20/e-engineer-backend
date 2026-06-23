import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { Deliverable } from '../../domain/entities/deliverable';
import { DeliverableStatus } from '../../domain/value-objects/deliverable-status.value-object';
import { DeliverableType } from '../../domain/value-objects/deliverable-type.value-object';
import { DeliverableResponseDto } from '../../presentation/dto/deliverable-response.dto';
import { DeliverableOrmEntity } from '../persistence/typeorm/deliverable.orm-entity';

export class DeliverableMapper {
  static toDomain(ormEntity: DeliverableOrmEntity): Deliverable {
    return Deliverable.restore(
      {
        organizationId: OrganizationId.create(ormEntity.organizationId),
        projectId: new UniqueEntityId(ormEntity.projectId),
        title: ormEntity.name,
        description: ormEntity.description,
        dueDate: ormEntity.dueDate,
        status: DeliverableStatus.fromPersistence(ormEntity.status),
        type: ormEntity.type
          ? DeliverableType.create(ormEntity.type)
          : DeliverableType.fromTitle(ormEntity.name),
        assignees: DeliverableMapper.assigneesFromOrm(ormEntity),
      },
      new UniqueEntityId(ormEntity.id),
    );
  }

  static toOrm(deliverable: Deliverable): DeliverableOrmEntity {
    const ormEntity = new DeliverableOrmEntity();

    ormEntity.id = deliverable.id;
    ormEntity.organizationId = deliverable.organizationId.toString();
    ormEntity.projectId = deliverable.projectId.toString();
    ormEntity.templateDeliverableId = null;
    ormEntity.name = deliverable.title;
    ormEntity.description = deliverable.description;
    ormEntity.dueDate = deliverable.dueDate;
    ormEntity.status = deliverable.status.value;
    ormEntity.type = deliverable.type.value;
    ormEntity.assignees = deliverable.assignees;
    ormEntity.responsibleName = deliverable.assignees[0] ?? null;

    return ormEntity;
  }

  static toResponse(
    deliverable: Deliverable,
    tags: Array<{
      id: string;
      name: string;
      slug: string;
      category: string;
      status: string;
    }> = [],
  ): DeliverableResponseDto {
    return {
      id: deliverable.id,
      projectId: deliverable.projectId.toString(),
      title: deliverable.title,
      description: deliverable.description ?? undefined,
      dueDate: deliverable.dueDate ?? undefined,
      status: deliverable.status.value,
      type: deliverable.type.value,
      assignees: deliverable.assignees,
      tagIds: tags.map((tag) => tag.id),
      tags,
      attachments: [],
    };
  }

  static ormToResponse(
    ormEntity: DeliverableOrmEntity,
    tags: Array<{
      id: string;
      name: string;
      slug: string;
      category: string;
      status: string;
    }> = [],
  ): DeliverableResponseDto {
    return DeliverableMapper.toResponse(DeliverableMapper.toDomain(ormEntity), tags);
  }

  private static assigneesFromOrm(ormEntity: DeliverableOrmEntity): string[] {
    if (Array.isArray(ormEntity.assignees) && ormEntity.assignees.length > 0) {
      return ormEntity.assignees;
    }

    return ormEntity.responsibleName ? [ormEntity.responsibleName] : [];
  }
}
