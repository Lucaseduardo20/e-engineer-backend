import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('document_tags')
@Index(['organizationId', 'documentId'])
@Index(['organizationId', 'tagId'])
@Index(['organizationId', 'documentId', 'tagId'], { unique: true })
export class DocumentTagOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'document_id', type: 'uuid' })
  documentId!: string;

  @Column({ name: 'tag_id', type: 'uuid' })
  tagId!: string;

  @Column({ type: 'varchar', length: 40, default: 'manual' })
  source!: string;

  @Column({ name: 'created_by', type: 'varchar', length: 120 })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
