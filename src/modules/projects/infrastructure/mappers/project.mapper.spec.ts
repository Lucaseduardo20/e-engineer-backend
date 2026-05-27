import { randomUUID } from 'crypto';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { Project } from '../../domain/entities/project';
import { ProjectStatus } from '../../domain/value-objects/project-status';
import { ProjectOrmEntity } from '../persistence/typeorm/project.orm-entity';
import { ProjectMapper } from './project.mapper';

describe('ProjectMapper', () => {
  it('maps domain projects to TypeORM entities', () => {
    const organizationId = randomUUID();
    const project = Project.create({
      organizationId: OrganizationId.create(organizationId),
      name: 'Ponte Norte',
      projectType: 'estrutural',
    });

    const ormEntity = ProjectMapper.toOrm(project);

    expect(ormEntity).toMatchObject({
      id: project.id,
      organizationId,
      name: 'Ponte Norte',
      projectType: 'estrutural',
      status: 'draft',
    });
  });

  it('maps TypeORM entities back to domain projects', () => {
    const ormEntity = new ProjectOrmEntity();
    ormEntity.id = randomUUID();
    ormEntity.organizationId = randomUUID();
    ormEntity.name = 'Drenagem Urbana';
    ormEntity.projectType = 'drenagem';
    ormEntity.status = ProjectStatus.create('in_progress').value;

    const project = ProjectMapper.toDomain(ormEntity);

    expect(project.id).toBe(ormEntity.id);
    expect(project.organizationId.toString()).toBe(ormEntity.organizationId);
    expect(project.name).toBe('Drenagem Urbana');
    expect(project.projectType).toBe('drenagem');
    expect(project.status.value).toBe('in_progress');
  });
});
