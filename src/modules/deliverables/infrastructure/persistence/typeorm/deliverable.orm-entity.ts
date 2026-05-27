import { Column, Entity } from 'typeorm';
import { TenantScopedOrmEntity } from '../../../../../shared/infrastructure/persistence/typeorm/tenant-scoped.orm-entity';
import type { DeliverableStatusValue } from '../../../domain/value-objects/deliverable-status.value-object';
import type { DeliverableTypeValue } from '../../../domain/value-objects/deliverable-type.value-object';

@Entity('deliverables')
export class DeliverableOrmEntity extends TenantScopedOrmEntity {
  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ name: 'template_deliverable_id', type: 'uuid', nullable: true })
  templateDeliverableId!: string | null;

  @Column({ type: 'varchar', length: 160 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 40 })
  status!: DeliverableStatusValue | string;

  @Column({ type: 'varchar', length: 80, default: 'technical_report' })
  type!: DeliverableTypeValue;

  @Column({
    name: 'responsible_name',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  responsibleName!: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  assignees!: string[];

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate!: string | null;
}
