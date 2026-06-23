import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateProjectRequestDto {
  @ApiPropertyOptional({ example: 'Construcao da UBS Vila Esperanca' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({ example: 'unidade de saude' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  projectType?: string;

  @ApiPropertyOptional({
    description:
      'IDs de TechnicalTags governadas. Quando ausente, as tags do projeto nao sao alteradas. Quando vazio, remove os vinculos.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
