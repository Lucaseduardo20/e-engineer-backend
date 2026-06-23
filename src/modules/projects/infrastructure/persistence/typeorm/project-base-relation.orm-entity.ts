import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('project_base_relations')
@Index(['organizationId', 'baseProjectId'])
@Index(['organizationId', 'targetProjectId'], { unique: true })
export class ProjectBaseRelationOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'base_project_id', type: 'uuid' })
  baseProjectId!: string;

  @Column({ name: 'target_project_id', type: 'uuid' })
  targetProjectId!: string;

  @Column({
    name: 'relation_type',
    type: 'varchar',
    length: 40,
    default: 'created_from_base',
  })
  relationType!: 'created_from_base';

  @Column({ name: 'inherit_tags', type: 'boolean', default: true })
  inheritTags!: boolean;

  @Column({ name: 'inherit_deliverables', type: 'boolean', default: false })
  inheritDeliverables!: boolean;

  @Column({ name: 'created_by', type: 'varchar', length: 120 })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
