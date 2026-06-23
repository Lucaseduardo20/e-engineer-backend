import { Column, Entity, Index } from 'typeorm';
import { TenantScopedOrmEntity } from '../../../../../shared/infrastructure/persistence/typeorm/tenant-scoped.orm-entity';

@Entity('review_comments')
@Index(['organizationId', 'reviewId'])
export class ReviewCommentOrmEntity extends TenantScopedOrmEntity {
  @Column({ name: 'review_id', type: 'uuid' })
  reviewId!: string;

  @Column({ name: 'author_user_id', type: 'varchar', length: 120 })
  authorUserId!: string;

  @Column({ type: 'text' })
  body!: string;
}
