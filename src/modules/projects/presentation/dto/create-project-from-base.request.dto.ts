import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateProjectFromBaseRequestDto {
  @ApiProperty({ description: 'Projeto existente usado como base.' })
  @IsUUID('4')
  baseProjectId!: string;

  @ApiProperty({ example: 'Nova UBS Jardim Aurora' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ example: 'Prefeitura SP' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  client?: string | null;

  @ApiPropertyOptional({ example: 'Projeto executivo de UBS baseado em referencia anterior.' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 'UBS' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  projectType?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  inheritTags?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  inheritDeliverables?: boolean;
}
