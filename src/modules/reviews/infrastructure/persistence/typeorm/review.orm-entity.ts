import { Column, Entity } from 'typeorm';
import { TenantScopedOrmEntity } from '../../../../../shared/infrastructure/persistence/typeorm/tenant-scoped.orm-entity';

@Entity('reviews')
export class ReviewOrmEntity extends TenantScopedOrmEntity {
  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ name: 'deliverable_id', type: 'uuid', nullable: true })
  deliverableId!: string | null;

  @Column({ name: 'document_version_id', type: 'uuid', nullable: true })
  documentVersionId!: string | null;

  @Column({ type: 'varchar', length: 40 })
  status!: string;

  @Column({ name: 'requested_by', type: 'varchar', length: 120 })
  requestedBy!: string;

  @Column({ name: 'reviewed_by', type: 'varchar', length: 120, nullable: true })
  reviewedBy!: string | null;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate!: string | null;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;
}
