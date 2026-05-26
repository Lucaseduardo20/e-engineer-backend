import { Column, Entity } from 'typeorm';
import { TenantScopedOrmEntity } from '../../../../../shared/infrastructure/persistence/typeorm/tenant-scoped.orm-entity';

@Entity('documents')
export class DocumentOrmEntity extends TenantScopedOrmEntity {
  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ name: 'deliverable_id', type: 'uuid', nullable: true })
  deliverableId!: string | null;

  @Column({ type: 'varchar', length: 180 })
  title!: string;
}
