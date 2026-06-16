import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('deliverable_tags')
@Index(['organizationId', 'deliverableId'])
@Index(['organizationId', 'tagId'])
@Index(['organizationId', 'deliverableId', 'tagId'], { unique: true })
export class DeliverableTagOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'deliverable_id', type: 'uuid' })
  deliverableId!: string;

  @Column({ name: 'tag_id', type: 'uuid' })
  tagId!: string;

  @Column({ type: 'varchar', length: 40, default: 'manual' })
  source!: string;

  @Column({ name: 'created_by', type: 'varchar', length: 120 })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
