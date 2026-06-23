import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class CreateProjectRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  projectType!: string;

  @IsOptional()
  @IsUUID()
  baseProjectId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
