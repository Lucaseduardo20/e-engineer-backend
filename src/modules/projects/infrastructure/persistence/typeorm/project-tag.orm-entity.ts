import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

export const PROJECT_TAG_SOURCES = [
  'manual',
  'inherited',
  'suggested',
  'system',
] as const;

export type ProjectTagSource = (typeof PROJECT_TAG_SOURCES)[number];

@Entity('project_tags')
@Index(['organizationId', 'projectId'])
@Index(['organizationId', 'tagId'])
@Index(['organizationId', 'projectId', 'tagId'], { unique: true })
export class ProjectTagOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ name: 'tag_id', type: 'uuid' })
  tagId!: string;

  @Column({ type: 'varchar', length: 40, default: 'manual' })
  source!: ProjectTagSource;

  @Column({ name: 'created_by', type: 'varchar', length: 120 })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
