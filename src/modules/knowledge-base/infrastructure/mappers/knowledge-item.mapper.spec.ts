import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { KnowledgeItem } from '../../domain/entities/knowledge-item';
import { KnowledgeItemType } from '../../domain/value-objects/knowledge-item-type.vo';
import { KnowledgeItemMapper } from './knowledge-item.mapper';

describe('KnowledgeItemMapper', () => {
  it('maps domain to orm and back', () => {
    const item = KnowledgeItem.create({
      organizationId: OrganizationId.create(
        '11111111-1111-4111-8111-111111111111',
      ),
      createdBy: 'user-1',
      title: 'Licao aprendida',
      type: KnowledgeItemType.create('lesson_learned'),
      tags: ['obra'],
      content: { problem: 'Retrabalho' },
    });

    const orm = KnowledgeItemMapper.toOrm(item);
    orm.createdAt = new Date('2026-05-28T10:00:00.000Z');
    orm.updatedAt = new Date('2026-05-28T10:00:00.000Z');
    const restored = KnowledgeItemMapper.toDomain(orm);

    expect(restored.id).toBe(item.id);
    expect(restored.type.value).toBe('lesson_learned');
    expect(restored.content).toEqual({ problem: 'Retrabalho' });
  });
});
