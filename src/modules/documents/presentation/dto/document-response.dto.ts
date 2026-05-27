import type {
  DocumentDetail,
  DocumentSummary,
  DocumentVersion,
} from '../../../../shared/contracts/dashboard.contracts';

export class DocumentVersionResponseDto implements DocumentVersion {
  id!: string;
  documentId!: string;
  revision!: string;
  fileName!: string;
  filePath!: string;
  uploadedBy!: string;
  uploadedAt!: string;
  isOfficial!: boolean;
  status!: string;
  notes?: string | null;
}

export class DocumentSummaryResponseDto implements DocumentSummary {
  id!: string;
  projectId!: string;
  deliverableId?: string | null;
  title!: string;
  description?: string | null;
  type!: string;
  officialRevision?: string | null;
  status!: string;
  updatedAt!: string;
  latestVersion?: DocumentVersionResponseDto | null;
  officialVersion?: DocumentVersionResponseDto | null;
}

export class DocumentResponseDto
  extends DocumentSummaryResponseDto
  implements DocumentDetail
{
  versions!: DocumentVersionResponseDto[];
}
