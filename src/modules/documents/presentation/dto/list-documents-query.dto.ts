import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../../shared/presentation/pagination-query.dto';
import {
  documentStatusValues,
  type DocumentStatusValue,
} from '../../domain/value-objects/document-status.value-object';
import {
  documentTypeValues,
  type DocumentTypeValue,
} from '../../domain/value-objects/document-type.value-object';

export class ListDocumentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  deliverableId?: string;

  @IsOptional()
  @IsIn(documentStatusValues)
  status?: DocumentStatusValue;

  @IsOptional()
  @IsIn(documentTypeValues)
  type?: DocumentTypeValue;
}
