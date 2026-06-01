import { Column, Entity, Index } from 'typeorm';
import { TenantScopedOrmEntity } from '../../../../../shared/infrastructure/persistence/typeorm/tenant-scoped.orm-entity';

@Entity('technical_tags')
@Index(['organizationId'])
@Index(['organizationId', 'slug'], { unique: true })
@Index(['organizationId', 'category'])
@Index(['organizationId', 'status'])
export class TechnicalTagOrmEntity extends TenantScopedOrmEntity {
  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 120 })
  slug!: string;

  @Column({ type: 'varchar', length: 40 })
  category!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 40, default: 'active' })
  status!: string;

  @Column({ name: 'created_by', type: 'varchar', length: 120 })
  createdBy!: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 120, nullable: true })
  updatedBy!: string | null;

  @Column({ name: 'archived_at', type: 'timestamptz', nullable: true })
  archivedAt!: Date | null;

  @Column({ name: 'deprecated_at', type: 'timestamptz', nullable: true })
  deprecatedAt!: Date | null;
}
