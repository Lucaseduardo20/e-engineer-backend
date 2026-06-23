import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDeliverableRemovalRequests1718215200000
  implements MigrationInterface
{
  name = 'CreateDeliverableRemovalRequests1718215200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS deliverable_removal_requests (
        id uuid PRIMARY KEY,
        organization_id uuid NOT NULL,
        project_id uuid NOT NULL,
        deliverable_id uuid NOT NULL,
        deliverable_title varchar(160) NOT NULL,
        requested_by varchar(120) NOT NULL,
        reason text NOT NULL,
        status varchar(24) NOT NULL,
        reviewed_by varchar(120),
        reviewed_at timestamptz,
        review_comment text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_deliverable_removal_requests_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_deliverable_removal_requests_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_deliverable_removal_requests_org_deliverable ON deliverable_removal_requests (organization_id, deliverable_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_deliverable_removal_requests_org_status ON deliverable_removal_requests (organization_id, status)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS deliverable_removal_requests`);
  }
}
