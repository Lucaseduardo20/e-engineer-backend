import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { KnowledgeItem } from './knowledge-item';
import { KnowledgeItemType } from '../value-objects/knowledge-item-type.vo';

describe('KnowledgeItem', () => {
  const organizationId = OrganizationId.new();

  it('creates a draft item with normalized tags', () => {
    const item = KnowledgeItem.create({
      organizationId,
      createdBy: 'user-1',
      title: '  Padrao de nomenclatura ',
      type: KnowledgeItemType.create('technical_standard'),
      tags: [' Documentos ', 'documentos', 'Revisao  tecnica'],
    });

    expect(item.title).toBe('Padrao de nomenclatura');
    expect(item.status.value).toBe('draft');
    expect(item.tags).toEqual(['documentos', 'revisao tecnica']);
    expect(item.visibility.value).toBe('organization');
  });

  it('does not allow creation without organization', () => {
    expect(() =>
      KnowledgeItem.create({
        organizationId: undefined as unknown as OrganizationId,
        createdBy: 'user-1',
        title: 'Padrao',
        type: KnowledgeItemType.create('technical_standard'),
      }),
    ).toThrow();
  });

  it('rejects an empty title', () => {
    expect(() =>
      KnowledgeItem.create({
        organizationId,
        createdBy: 'user-1',
        title: ' ',
        type: KnowledgeItemType.create('technical_standard'),
      }),
    ).toThrow('Knowledge item title is required.');
  });

  it('publishes a draft item and marks as official', () => {
    const item = KnowledgeItem.create({
      organizationId,
      createdBy: 'user-1',
      title: 'Checklist de revisao',
      type: KnowledgeItemType.create('review_checklist'),
    });

    item.publish('admin-1');

    expect(item.status.value).toBe('published');
    expect(item.publishedAt).toBeInstanceOf(Date);
    expect(item.isOfficial()).toBe(true);
    expect(item.canBeRecommended()).toBe(true);
  });

  it('archives item', () => {
    const item = KnowledgeItem.create({
      organizationId,
      createdBy: 'user-1',
      title: 'Modelo antigo',
      type: KnowledgeItemType.create('document_model'),
    });

    item.archive('admin-1');

    expect(item.status.value).toBe('archived');
    expect(item.archivedAt).toBeInstanceOf(Date);
    expect(item.isArchived()).toBe(true);
  });

  it('deprecates item and it cannot be recommended', () => {
    const item = KnowledgeItem.create({
      organizationId,
      createdBy: 'user-1',
      title: 'Padrao obsoleto',
      type: KnowledgeItemType.create('technical_standard'),
    });

    item.publish('admin-1');
    item.deprecate('admin-1');

    expect(item.status.value).toBe('deprecated');
    expect(item.deprecatedAt).toBeInstanceOf(Date);
    expect(item.isDeprecated()).toBe(true);
    expect(item.canBeRecommended()).toBe(false);
  });

  it('does not publish directly from archived', () => {
    const item = KnowledgeItem.create({
      organizationId,
      createdBy: 'user-1',
      title: 'Modelo antigo',
      type: KnowledgeItemType.create('document_model'),
    });

    item.archive('admin-1');

    expect(() => item.publish('admin-1')).toThrow(
      'Only draft knowledge items can be published.',
    );
  });
});
