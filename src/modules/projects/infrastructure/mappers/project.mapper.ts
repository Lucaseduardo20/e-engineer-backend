import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { Project } from '../../domain/entities/project';
import { ProjectStatus } from '../../domain/value-objects/project-status';
import { ProjectOrmEntity } from '../persistence/typeorm/project.orm-entity';

export class ProjectMapper {
  static toDomain(ormEntity: ProjectOrmEntity): Project {
    return Project.restore(
      {
        organizationId: OrganizationId.create(ormEntity.organizationId),
        name: ormEntity.name,
        projectType: ormEntity.projectType,
        status: ProjectStatus.create(ormEntity.status),
      },
      new UniqueEntityId(ormEntity.id),
    );
  }

  static toOrm(project: Project): ProjectOrmEntity {
    const ormEntity = new ProjectOrmEntity();

    ormEntity.id = project.id;
    ormEntity.organizationId = project.organizationId.toString();
    ormEntity.name = project.name;
    ormEntity.projectType = project.projectType;
    ormEntity.status = project.status.value;

    return ormEntity;
  }
}
