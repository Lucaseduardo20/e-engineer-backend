import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { Deliverable } from '../../domain/entities/deliverable';
import { DeliverableStatus } from '../../domain/value-objects/deliverable-status.value-object';
import { DeliverableType } from '../../domain/value-objects/deliverable-type.value-object';
import { DeliverableMapper } from './deliverable.mapper';

describe('DeliverableMapper', () => {
  it('maps legacy orm statuses and responsible names to the domain contract', () => {
    const response = DeliverableMapper.ormToResponse({
      id: '14d03a7b-205c-4bf8-a793-c39862b0a001',
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      projectId: '5c6c3c65-3e8a-4f0c-9235-8f65828951f1',
      templateDeliverableId: null,
      name: 'Projeto arquitetonico',
      description: null,
      status: 'approved',
      type: 'architectural_project',
      responsibleName: 'Lucas Eduardo',
      assignees: [],
      dueDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(response).toMatchObject({
      id: '14d03a7b-205c-4bf8-a793-c39862b0a001',
      projectId: '5c6c3c65-3e8a-4f0c-9235-8f65828951f1',
      title: 'Projeto arquitetonico',
      status: 'done',
      type: 'architectural_project',
      assignees: ['Lucas Eduardo'],
    });
  });

  it('maps domain entities to persistence without leaking TypeORM classes', () => {
    const deliverable = Deliverable.create({
      organizationId: OrganizationId.create(
        '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      ),
      projectId: new UniqueEntityId('5c6c3c65-3e8a-4f0c-9235-8f65828951f1'),
      title: 'Cronograma fisico-financeiro',
      type: DeliverableType.create('schedule'),
      status: DeliverableStatus.create('in_progress'),
      assignees: ['Leonardo'],
    });

    expect(DeliverableMapper.toOrm(deliverable)).toMatchObject({
      id: deliverable.id,
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      projectId: '5c6c3c65-3e8a-4f0c-9235-8f65828951f1',
      name: 'Cronograma fisico-financeiro',
      status: 'in_progress',
      type: 'schedule',
      responsibleName: 'Leonardo',
      assignees: ['Leonardo'],
    });
  });
});
