import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { KnowledgeItemOrmEntity } from './knowledge-item.orm-entity';

@Entity('knowledge_attachments')
@Index(['organizationId', 'knowledgeItemId'])
@Index(['organizationId', 'fileId'])
export class KnowledgeAttachmentOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'knowledge_item_id', type: 'uuid' })
  knowledgeItemId!: string;

  @Column({ name: 'file_id', type: 'uuid' })
  fileId!: string;

  @Column({ type: 'varchar', length: 120 })
  label!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'created_by', type: 'varchar', length: 120 })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => KnowledgeItemOrmEntity, (item) => item.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'knowledge_item_id', referencedColumnName: 'id' })
  item!: KnowledgeItemOrmEntity;
}
