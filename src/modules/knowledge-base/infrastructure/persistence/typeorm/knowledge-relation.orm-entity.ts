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

@Entity('knowledge_relations')
@Index(['organizationId', 'knowledgeItemId'])
@Index(['organizationId', 'targetType', 'targetId'])
export class KnowledgeRelationOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'knowledge_item_id', type: 'uuid' })
  knowledgeItemId!: string;

  @Column({ name: 'target_type', type: 'varchar', length: 40 })
  targetType!: string;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId!: string;

  @Column({ name: 'relation_type', type: 'varchar', length: 40 })
  relationType!: string;

  @Column({ name: 'created_by', type: 'varchar', length: 120 })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => KnowledgeItemOrmEntity, (item) => item.relations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'knowledge_item_id', referencedColumnName: 'id' })
  item!: KnowledgeItemOrmEntity;
}
