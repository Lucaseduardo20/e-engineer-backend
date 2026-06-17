import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/infrastructure/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../../shared/infrastructure/auth/permissions.guard';
import { RequirePermissions } from '../../../../shared/infrastructure/auth/require-permissions.decorator';
import { permissions } from '../../../../shared/application/authorization/permissions';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/auth/authenticated-request';
import {
  ok,
  type ApiResponse,
} from '../../../../shared/presentation/api-response';
import type {
  DocumentDetail,
  DocumentSummary,
  Paginated,
} from '../../../../shared/contracts/dashboard.contracts';
import { CreateDocumentUseCase } from '../../application/use-cases/create-document.use-case';
import { DeleteDocumentUseCase } from '../../application/use-cases/delete-document.use-case';
import { GetDocumentUseCase } from '../../application/use-cases/get-document.use-case';
import { ListDocumentsUseCase } from '../../application/use-cases/list-documents.use-case';
import { UpdateDocumentUseCase } from '../../application/use-cases/update-document.use-case';
import { UploadDocumentVersionUseCase } from '../../application/use-cases/upload-document-version.use-case';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { DocumentResponseDto } from '../dto/document-response.dto';
import { ListDocumentsQueryDto } from '../dto/list-documents-query.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { UploadDocumentDto } from '../dto/upload-document.dto';
import { SaveDocumentAsModelDto } from '../dto/save-document-as-model.dto';
import { SaveDocumentAsKnowledgeModelUseCase } from '../../application/use-cases/save-document-as-knowledge-model.use-case';

interface UploadedDocumentFile {
  originalname: string;
  mimetype?: string;
  size: number;
  buffer: Buffer;
}

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    private readonly listDocumentsUseCase: ListDocumentsUseCase,
    private readonly getDocumentUseCase: GetDocumentUseCase,
    private readonly updateDocumentUseCase: UpdateDocumentUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
    private readonly uploadDocumentVersionUseCase: UploadDocumentVersionUseCase,
    private readonly saveDocumentAsKnowledgeModelUseCase: SaveDocumentAsKnowledgeModelUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'Lista paginada de documentos tecnicos.' })
  async list(
    @Query() query: ListDocumentsQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<Paginated<DocumentSummary>>> {
    return ok(
      await this.listDocumentsUseCase.execute({
        organizationId: request.user.organizationId,
        page: query.page,
        pageSize: query.pageSize,
        projectId: query.projectId,
        deliverableId: query.deliverableId,
        status: query.status,
        type: query.type,
      }),
    );
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalhe de um documento tecnico.' })
  async detail(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<DocumentDetail>> {
    const document = await this.getDocumentUseCase.execute({
      organizationId: request.user.organizationId,
      documentId: id,
    });

    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    return ok(document);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Documento tecnico criado.' })
  async create(
    @Body() body: CreateDocumentDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<DocumentResponseDto>> {
    const result = await this.createDocumentUseCase.execute({
      ...body,
      organizationId: request.user.organizationId,
      createdBy: request.user.userId,
    });

    if (result.isFail()) {
      throw new BadRequestException(result.unwrapError().message);
    }

    return ok(result.unwrap());
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Documento tecnico atualizado.' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateDocumentDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<DocumentResponseDto>> {
    const result = await this.updateDocumentUseCase.execute({
      ...body,
      organizationId: request.user.organizationId,
      documentId: id,
      updatedBy: request.user.userId,
    });

    if (result.isFail()) {
      this.throwResultError(result.unwrapError());
    }

    return ok(result.unwrap());
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Documento tecnico excluido.' })
  async delete(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<{ deleted: true }>> {
    const result = await this.deleteDocumentUseCase.execute({
      organizationId: request.user.organizationId,
      documentId: id,
    });

    if (result.isFail()) {
      this.throwResultError(result.unwrapError());
    }

    return ok({ deleted: true });
  }

  @Post(':id/versions')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        revision: { type: 'string' },
        isOfficial: { type: 'boolean' },
        status: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['file'],
    },
  })
  @ApiCreatedResponse({ description: 'Nova versao de documento enviada.' })
  async uploadVersion(
    @Param('id') id: string,
    @UploadedFile() file: UploadedDocumentFile | undefined,
    @Body() body: UploadDocumentDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<DocumentResponseDto>> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Document file is required.');
    }

    const result = await this.uploadDocumentVersionUseCase.execute({
      organizationId: request.user.organizationId,
      documentId: id,
      uploadedBy: request.user.userId,
      fileName: file.originalname,
      contentType: file.mimetype,
      buffer: file.buffer,
      revision: body.revision,
      isOfficial: body.isOfficial,
      status: body.status,
      notes: body.notes,
    });

    if (result.isFail()) {
      this.throwResultError(result.unwrapError());
    }

    return ok(result.unwrap());
  }

  @Post(':id/upload')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({
    description: 'Alias para envio de versao de documento.',
  })
  upload(
    @Param('id') id: string,
    @UploadedFile() file: UploadedDocumentFile | undefined,
    @Body() body: UploadDocumentDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<DocumentResponseDto>> {
    return this.uploadVersion(id, file, body, request);
  }

  @Post(':id/save-as-model')
  @RequirePermissions(permissions.knowledge.saveDocumentModel)
  @ApiCreatedResponse({ description: 'Documento salvo como modelo de conhecimento.' })
  async saveAsModel(
    @Param('id') id: string,
    @Body() body: SaveDocumentAsModelDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<{ item: unknown; warning?: string }>> {
    const result = await this.saveDocumentAsKnowledgeModelUseCase.execute({
      ...body,
      organizationId: request.user.organizationId,
      documentId: id,
      createdBy: request.user.userId,
    });

    if (result.isFail()) {
      this.throwResultError(result.unwrapError());
    }

    return ok(result.unwrap());
  }

  @Post(':id/versions/:versionId/save-as-model')
  @RequirePermissions(permissions.knowledge.saveDocumentModel)
  @ApiCreatedResponse({
    description: 'Versao oficial de documento salva como modelo de conhecimento.',
  })
  async saveVersionAsModel(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Body() body: SaveDocumentAsModelDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<{ item: unknown; warning?: string }>> {
    const result = await this.saveDocumentAsKnowledgeModelUseCase.execute({
      ...body,
      organizationId: request.user.organizationId,
      documentId: id,
      documentVersionId: versionId,
      createdBy: request.user.userId,
    });
    if (result.isFail()) this.throwResultError(result.unwrapError());
    return ok(result.unwrap());
  }

  private throwResultError(error: Error): never {
    if (error.message.endsWith('not found.')) {
      throw new NotFoundException(error.message);
    }

    throw new BadRequestException(error.message);
  }
}
