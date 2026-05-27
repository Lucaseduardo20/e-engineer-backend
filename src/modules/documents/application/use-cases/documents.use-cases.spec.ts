import { randomUUID } from 'crypto';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../shared/domain/value-objects/unique-entity-id';
import { Document } from '../../domain/entities/document';
import { DocumentRepository } from '../../domain/repositories/document.repository';
import { DocumentStatus } from '../../domain/value-objects/document-status.value-object';
import { DocumentType } from '../../domain/value-objects/document-type.value-object';
import { S3StorageService } from '../../infrastructure/storage/s3-storage.service';
import { CreateDocumentUseCase } from './create-document.use-case';
import { ListDocumentsUseCase } from './list-documents.use-case';
import { UploadDocumentVersionUseCase } from './upload-document-version.use-case';

function createRepository(): jest.Mocked<DocumentRepository> {
  return {
    addVersion: jest.fn(),
    delete: jest.fn(),
    deliverableExists: jest.fn(),
    findById: jest.fn(),
    getById: jest.fn(),
    list: jest.fn(),
    projectExists: jest.fn(),
    save: jest.fn(),
  };
}

describe('Documents use cases', () => {
  it('creates documents with tenant scope and engineering document type', async () => {
    const repository = createRepository();
    repository.projectExists.mockResolvedValue(true);
    const useCase = new CreateDocumentUseCase(repository);
    const organizationId = randomUUID();
    const projectId = randomUUID();

    const result = await useCase.execute({
      organizationId,
      projectId,
      title: ' Memorial estrutural ',
      type: 'projeto_estrutural',
      status: 'draft',
    });

    expect(result.isOk()).toBe(true);
    expect(repository.projectExists).toHaveBeenCalledWith(
      new UniqueEntityId(projectId),
      OrganizationId.create(organizationId),
    );
    expect(repository.save).toHaveBeenCalledWith(expect.any(Document));
    expect(result.unwrap()).toMatchObject({
      projectId,
      title: 'Memorial estrutural',
      type: 'projeto_estrutural',
      status: 'draft',
    });
  });

  it('rejects creation when the project is outside the organization', async () => {
    const repository = createRepository();
    repository.projectExists.mockResolvedValue(false);
    const useCase = new CreateDocumentUseCase(repository);

    const result = await useCase.execute({
      organizationId: randomUUID(),
      projectId: randomUUID(),
      title: 'Laudo de vistoria',
      type: 'laudo',
    });

    expect(result.isFail()).toBe(true);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('lists documents with project, status and type filters', async () => {
    const repository = createRepository();
    repository.list.mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      pageSize: 10,
    });
    const useCase = new ListDocumentsUseCase(repository);
    const organizationId = randomUUID();
    const projectId = randomUUID();

    await useCase.execute({
      organizationId,
      projectId,
      page: 2,
      pageSize: 10,
      status: 'approved',
      type: 'orcamento',
    });

    expect(repository.list).toHaveBeenCalledWith(
      OrganizationId.create(organizationId),
      {
        projectId: new UniqueEntityId(projectId),
        deliverableId: undefined,
        page: 2,
        pageSize: 10,
        status: 'approved',
        type: 'orcamento',
      },
    );
  });

  it('uploads a document version through storage and marks official metadata', async () => {
    const repository = createRepository();
    const document = Document.create({
      organizationId: OrganizationId.create(randomUUID()),
      projectId: new UniqueEntityId(),
      title: 'Orcamento executivo',
      type: DocumentType.create('orcamento'),
      status: DocumentStatus.draft(),
    });
    const storage = {
      upload: jest
        .fn()
        .mockResolvedValue('s3://bucket/documentos/orcamento.pdf'),
    } as unknown as jest.Mocked<S3StorageService>;
    repository.findById.mockResolvedValue(document);
    const useCase = new UploadDocumentVersionUseCase(repository, storage);

    const result = await useCase.execute({
      organizationId: document.organizationId.toString(),
      documentId: document.id,
      uploadedBy: 'user-1',
      fileName: 'orcamento.pdf',
      buffer: Buffer.from('pdf'),
      status: 'approved',
      isOfficial: true,
      notes: 'Versao assinada',
    });

    expect(result.isOk()).toBe(true);
    expect(storage.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: document.organizationId.toString(),
        documentId: document.id,
        fileName: 'orcamento.pdf',
      }),
    );
    expect(repository.addVersion).toHaveBeenCalledWith(
      document,
      expect.objectContaining({
        filePath: 's3://bucket/documentos/orcamento.pdf',
        isOfficial: true,
      }),
    );
  });
});
