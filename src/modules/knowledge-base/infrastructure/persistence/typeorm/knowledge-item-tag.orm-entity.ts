import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('knowledge_item_tags')
@Index(['organizationId', 'knowledgeItemId'])
@Index(['organizationId', 'tagId'])
@Index(['organizationId', 'knowledgeItemId', 'tagId'], { unique: true })
export class KnowledgeItemTagOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'knowledge_item_id', type: 'uuid' })
  knowledgeItemId!: string;

  @Column({ name: 'tag_id', type: 'uuid' })
  tagId!: string;

  @Column({ name: 'created_by', type: 'varchar', length: 120 })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
