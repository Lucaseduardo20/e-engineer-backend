import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Result } from '../../../../shared/application/result/result';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import { CreateDocumentUseCase } from '../../application/use-cases/create-document.use-case';
import { DeleteDocumentUseCase } from '../../application/use-cases/delete-document.use-case';
import { GetDocumentUseCase } from '../../application/use-cases/get-document.use-case';
import { ListDocumentsUseCase } from '../../application/use-cases/list-documents.use-case';
import { UpdateDocumentUseCase } from '../../application/use-cases/update-document.use-case';
import { UploadDocumentVersionUseCase } from '../../application/use-cases/upload-document-version.use-case';
import { SaveDocumentAsKnowledgeModelUseCase } from '../../application/use-cases/save-document-as-knowledge-model.use-case';
import { DocumentsController } from './documents.controller';

function createRequest(): AuthenticatedRequest {
  return {
    user: {
      userId: 'user-1',
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
    },
  } as AuthenticatedRequest;
}

describe('DocumentsController', () => {
  let createDocumentUseCase: jest.Mocked<CreateDocumentUseCase>;
  let listDocumentsUseCase: jest.Mocked<ListDocumentsUseCase>;
  let getDocumentUseCase: jest.Mocked<GetDocumentUseCase>;
  let updateDocumentUseCase: jest.Mocked<UpdateDocumentUseCase>;
  let deleteDocumentUseCase: jest.Mocked<DeleteDocumentUseCase>;
  let uploadDocumentVersionUseCase: jest.Mocked<UploadDocumentVersionUseCase>;
  let saveDocumentAsKnowledgeModelUseCase: jest.Mocked<SaveDocumentAsKnowledgeModelUseCase>;
  let controller: DocumentsController;

  beforeEach(() => {
    createDocumentUseCase = { execute: jest.fn() } as never;
    listDocumentsUseCase = { execute: jest.fn() } as never;
    getDocumentUseCase = { execute: jest.fn() } as never;
    updateDocumentUseCase = { execute: jest.fn() } as never;
    deleteDocumentUseCase = { execute: jest.fn() } as never;
    uploadDocumentVersionUseCase = { execute: jest.fn() } as never;
    saveDocumentAsKnowledgeModelUseCase = { execute: jest.fn() } as never;
    controller = new DocumentsController(
      createDocumentUseCase,
      listDocumentsUseCase,
      getDocumentUseCase,
      updateDocumentUseCase,
      deleteDocumentUseCase,
      uploadDocumentVersionUseCase,
      saveDocumentAsKnowledgeModelUseCase,
    );
  });

  it('lists documents using the authenticated organization', async () => {
    listDocumentsUseCase.execute.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    });

    await expect(
      controller.list(
        {
          page: 1,
          pageSize: 10,
          projectId: '5c6c3c65-3e8a-4f0c-9235-8f65828951f1',
          status: 'approved',
          type: 'laudo',
        },
        createRequest(),
      ),
    ).resolves.toEqual({
      data: { items: [], total: 0, page: 1, pageSize: 10 },
    });
    expect(listDocumentsUseCase.execute).toHaveBeenCalledWith({
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      projectId: '5c6c3c65-3e8a-4f0c-9235-8f65828951f1',
      deliverableId: undefined,
      page: 1,
      pageSize: 10,
      status: 'approved',
      type: 'laudo',
    });
  });

  it('creates documents without accepting organizationId from the body', async () => {
    createDocumentUseCase.execute.mockResolvedValue(
      Result.ok({
        id: 'document-1',
        projectId: 'project-1',
        title: 'Memorial',
        type: 'memorial_descritivo',
        status: 'draft',
        updatedAt: new Date().toISOString(),
        versions: [],
      }),
    );

    await controller.create(
      {
        projectId: 'project-1',
        title: 'Memorial',
        type: 'memorial_descritivo',
      },
      createRequest(),
    );

    expect(createDocumentUseCase.execute).toHaveBeenCalledWith({
      organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
      projectId: 'project-1',
      title: 'Memorial',
      type: 'memorial_descritivo',
      createdBy: 'user-1',
    });
  });

  it('maps missing document details to not found', async () => {
    getDocumentUseCase.execute.mockResolvedValue(null);

    await expect(
      controller.detail('missing', createRequest()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('uploads versions with authenticated user as uploader', async () => {
    uploadDocumentVersionUseCase.execute.mockResolvedValue(
      Result.ok({
        id: 'document-1',
        projectId: 'project-1',
        title: 'Laudo',
        type: 'laudo',
        status: 'approved',
        updatedAt: new Date().toISOString(),
        versions: [],
      }),
    );

    await controller.uploadVersion(
      'document-1',
      {
        originalname: 'laudo.pdf',
        mimetype: 'application/pdf',
        size: 3,
        buffer: Buffer.from('pdf'),
      },
      { isOfficial: true, status: 'approved' },
      createRequest(),
    );

    expect(uploadDocumentVersionUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001',
        documentId: 'document-1',
        uploadedBy: 'user-1',
        fileName: 'laudo.pdf',
        isOfficial: true,
      }),
    );
  });

  it('requires a file for version upload', async () => {
    await expect(
      controller.uploadVersion('document-1', undefined, {}, createRequest()),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
