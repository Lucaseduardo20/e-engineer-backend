import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { Document } from '../../domain/entities/document';
import { DocumentStatus } from '../../domain/value-objects/document-status.value-object';
import { DocumentType } from '../../domain/value-objects/document-type.value-object';
import { DocumentMapper } from './document.mapper';

describe('DocumentMapper', () => {
  it('maps document domain entities with official versions to API response', () => {
    const document = Document.create({
      organizationId: OrganizationId.create(
        '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      ),
      projectId: new UniqueEntityId('5c6c3c65-3e8a-4f0c-9235-8f65828951f1'),
      title: 'Laudo de fundacao',
      type: DocumentType.create('laudo'),
      status: DocumentStatus.create('in_review'),
    });

    document.addVersion({
      revision: 'r01',
      fileName: 'laudo.pdf',
      filePath: 's3://bucket/laudo.pdf',
      uploadedBy: 'user-1',
      isOfficial: true,
      status: DocumentStatus.create('approved'),
    });

    expect(DocumentMapper.toResponse(document)).toMatchObject({
      projectId: '5c6c3c65-3e8a-4f0c-9235-8f65828951f1',
      title: 'Laudo de fundacao',
      type: 'laudo',
      status: 'approved',
      officialRevision: 'R01',
      versions: [{ fileName: 'laudo.pdf', isOfficial: true }],
    });
  });
});
