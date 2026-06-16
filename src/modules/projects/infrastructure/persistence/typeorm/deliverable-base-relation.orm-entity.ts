import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('deliverable_base_relations')
@Index(['organizationId', 'baseDeliverableId'])
@Index(['organizationId', 'targetDeliverableId'], { unique: true })
export class DeliverableBaseRelationOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'base_project_id', type: 'uuid' })
  baseProjectId!: string;

  @Column({ name: 'target_project_id', type: 'uuid' })
  targetProjectId!: string;

  @Column({ name: 'base_deliverable_id', type: 'uuid' })
  baseDeliverableId!: string;

  @Column({ name: 'target_deliverable_id', type: 'uuid' })
  targetDeliverableId!: string;

  @Column({
    name: 'relation_type',
    type: 'varchar',
    length: 40,
    default: 'inherited_from_base',
  })
  relationType!: string;

  @Column({
    name: 'needs_review_after_inheritance',
    type: 'boolean',
    default: true,
  })
  needsReviewAfterInheritance!: boolean;

  @Column({ name: 'reviewed_by', type: 'varchar', length: 120, nullable: true })
  reviewedBy!: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;

  @Column({ name: 'created_by', type: 'varchar', length: 120 })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
