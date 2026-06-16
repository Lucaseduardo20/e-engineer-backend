import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class RecommendSimilarProjectsDto {
  @ApiProperty({
    description: 'Tags governadas selecionadas para o novo projeto.',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds!: string[];

  @ApiPropertyOptional({
    description: 'Quantidade maxima de projetos semelhantes.',
    default: 6,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  limit?: number;
}
