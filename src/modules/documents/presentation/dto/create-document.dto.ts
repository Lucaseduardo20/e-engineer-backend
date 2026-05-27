import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import {
  documentStatusValues,
  type DocumentStatusValue,
} from '../../domain/value-objects/document-status.value-object';
import {
  documentTypeValues,
  type DocumentTypeValue,
} from '../../domain/value-objects/document-type.value-object';

export class CreateDocumentDto {
  @IsUUID()
  projectId!: string;

  @IsOptional()
  @IsUUID()
  deliverableId?: string;

  @IsString()
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsIn(documentTypeValues)
  type!: DocumentTypeValue;

  @IsOptional()
  @IsIn(documentStatusValues)
  status?: DocumentStatusValue;
}
