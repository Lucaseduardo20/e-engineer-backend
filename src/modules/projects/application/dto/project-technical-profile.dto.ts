export interface ProjectTechnicalProfileSourceDto {
  type: 'project_tag' | 'deliverable_tag' | 'document_tag' | 'official_document';
  score: number;
}

export interface ProjectTechnicalProfileTagDto {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  score: number;
  sources: ProjectTechnicalProfileSourceDto[];
}

export interface ProjectTechnicalProfileResponseDto {
  projectId: string;
  organizationId: string;
  scoreExplanation: string;
  tags: ProjectTechnicalProfileTagDto[];
}
