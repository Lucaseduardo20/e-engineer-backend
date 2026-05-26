import { Column, Entity } from 'typeorm';
import { TenantScopedOrmEntity } from '../../../../../shared/infrastructure/persistence/typeorm/tenant-scoped.orm-entity';

@Entity('document_versions')
export class DocumentVersionOrmEntity extends TenantScopedOrmEntity {
  @Column({ name: 'document_id', type: 'uuid' })
  documentId!: string;

  @Column({ type: 'varchar', length: 20 })
  revision!: string;

  @Column({ name: 'file_name', type: 'varchar', length: 220 })
  fileName!: string;

  @Column({ name: 'file_path', type: 'text' })
  filePath!: string;

  @Column({ name: 'uploaded_by', type: 'varchar', length: 120 })
  uploadedBy!: string;

  @Column({ name: 'uploaded_at', type: 'timestamptz' })
  uploadedAt!: Date;

  @Column({ name: 'is_official', type: 'boolean' })
  isOfficial!: boolean;

  @Column({ type: 'varchar', length: 40 })
  status!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
