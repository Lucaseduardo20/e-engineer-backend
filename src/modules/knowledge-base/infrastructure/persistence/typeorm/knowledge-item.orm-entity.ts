import { Column, Entity, Index, OneToMany } from 'typeorm';
import { TenantScopedOrmEntity } from '../../../../../shared/infrastructure/persistence/typeorm/tenant-scoped.orm-entity';
import { KnowledgeAttachmentOrmEntity } from './knowledge-attachment.orm-entity';
import { KnowledgeRelationOrmEntity } from './knowledge-relation.orm-entity';

@Entity('knowledge_items')
@Index(['organizationId', 'status'])
@Index(['organizationId', 'type'])
export class KnowledgeItemOrmEntity extends TenantScopedOrmEntity {
  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 40 })
  type!: string;

  @Column({ type: 'varchar', length: 40, default: 'draft' })
  status!: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  tags!: string[];

  @Column({ type: 'jsonb', nullable: true })
  content!: Record<string, unknown> | null;

  @Column({ name: 'created_by', type: 'varchar', length: 120 })
  createdBy!: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 120 })
  updatedBy!: string;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'archived_at', type: 'timestamptz', nullable: true })
  archivedAt!: Date | null;

  @OneToMany(() => KnowledgeRelationOrmEntity, (relation) => relation.item)
  relations!: KnowledgeRelationOrmEntity[];

  @OneToMany(() => KnowledgeAttachmentOrmEntity, (attachment) => attachment.item)
  attachments!: KnowledgeAttachmentOrmEntity[];
}
