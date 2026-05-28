import type {
  ReviewComment,
  ReviewDetail,
  ReviewSummary,
} from '../../../../shared/contracts/dashboard.contracts';

export class ReviewSummaryResponseDto implements ReviewSummary {
  id!: string;
  projectId!: string;
  deliverableId?: string | null;
  documentId?: string | null;
  documentVersionId?: string | null;
  status!: string;
  requestedBy!: string;
  reviewers!: { userId: string; role: string }[];
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  dueDate?: string | null;
  comment?: string | null;
  decisionComment?: string | null;
  updatedAt?: string;
}

export class ReviewResponseDto
  extends ReviewSummaryResponseDto
  implements ReviewDetail
{
  comments?: ReviewComment[];
}
