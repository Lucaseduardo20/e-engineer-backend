import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  documentStatusValues,
  type DocumentStatusValue,
} from '../../domain/value-objects/document-status.value-object';

export class UploadDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  revision?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isOfficial?: boolean;

  @IsOptional()
  @IsIn(documentStatusValues)
  status?: DocumentStatusValue;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
