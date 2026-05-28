import { Column, Entity, Index } from 'typeorm';
import { TenantScopedOrmEntity } from '../../../../../shared/infrastructure/persistence/typeorm/tenant-scoped.orm-entity';

@Entity('users')
export class UserOrmEntity extends TenantScopedOrmEntity {
  @Index('idx_users_email_unique', { unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'varchar', length: 160 })
  name!: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl!: string | null;

  @Column({ name: 'is_platform_admin', type: 'boolean', default: false })
  isPlatformAdmin!: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;
}
