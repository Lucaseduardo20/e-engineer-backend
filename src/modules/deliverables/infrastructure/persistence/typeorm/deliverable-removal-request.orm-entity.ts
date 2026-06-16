import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('deliverable_removal_requests')
@Index(['organizationId', 'deliverableId'])
@Index(['organizationId', 'status'])
export class DeliverableRemovalRequestOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ name: 'deliverable_id', type: 'uuid' })
  deliverableId!: string;

  @Column({ name: 'deliverable_title', type: 'varchar', length: 160 })
  deliverableTitle!: string;

  @Column({ name: 'requested_by', type: 'varchar', length: 120 })
  requestedBy!: string;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ type: 'varchar', length: 24 })
  status!: 'requested' | 'approved' | 'rejected';

  @Column({ name: 'reviewed_by', type: 'varchar', length: 120, nullable: true })
  reviewedBy!: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;

  @Column({ name: 'review_comment', type: 'text', nullable: true })
  reviewComment!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
