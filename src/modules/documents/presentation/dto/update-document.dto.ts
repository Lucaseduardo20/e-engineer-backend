import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import {
  documentStatusValues,
  type DocumentStatusValue,
} from '../../domain/value-objects/document-status.value-object';
import {
  documentTypeValues,
  type DocumentTypeValue,
} from '../../domain/value-objects/document-type.value-object';

export class UpdateDocumentDto {
  @IsOptional()
  @IsUUID()
  deliverableId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsIn(documentTypeValues)
  type?: DocumentTypeValue;

  @IsOptional()
  @IsIn(documentStatusValues)
  status?: DocumentStatusValue;
}
