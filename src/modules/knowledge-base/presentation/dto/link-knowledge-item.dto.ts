import { IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class LinkKnowledgeItemDto {
  @IsString()
  @MaxLength(40)
  @Matches(/^[a-z][a-z0-9_]{1,39}$/)
  targetType!: string;

  @IsUUID()
  targetId!: string;

  @IsString()
  @MaxLength(40)
  @Matches(/^[a-z][a-z0-9_]{1,39}$/)
  relationType!: string;
}
