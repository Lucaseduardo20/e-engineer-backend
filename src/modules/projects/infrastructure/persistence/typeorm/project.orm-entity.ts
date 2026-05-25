import { Column, Entity } from 'typeorm';
import { TenantScopedOrmEntity } from '../../../../../shared/infrastructure/persistence/typeorm/tenant-scoped.orm-entity';
import type { ProjectStatusValue } from '../../../domain/value-objects/project-status';

@Entity('projects')
export class ProjectOrmEntity extends TenantScopedOrmEntity {
  @Column({ type: 'varchar', length: 160 })
  name!: string;

  @Column({ name: 'project_type', type: 'varchar', length: 120 })
  projectType!: string;

  @Column({ type: 'varchar', length: 40 })
  status!: ProjectStatusValue;
}
