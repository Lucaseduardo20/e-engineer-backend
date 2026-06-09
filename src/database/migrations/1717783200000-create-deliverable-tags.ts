import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDeliverableTags1717783200000 implements MigrationInterface {
  name = 'CreateDeliverableTags1717783200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS deliverable_tags (
        id uuid PRIMARY KEY,
        organization_id uuid NOT NULL,
        deliverable_id uuid NOT NULL,
        tag_id uuid NOT NULL,
        created_by varchar(120) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_deliverable_tags_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_deliverable_tags_deliverable FOREIGN KEY (deliverable_id) REFERENCES deliverables(id) ON DELETE CASCADE,
        CONSTRAINT fk_deliverable_tags_tag FOREIGN KEY (tag_id) REFERENCES technical_tags(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_deliverable_tags_org ON deliverable_tags (organization_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_deliverable_tags_org_deliverable ON deliverable_tags (organization_id, deliverable_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_deliverable_tags_org_tag ON deliverable_tags (organization_id, tag_id)`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_deliverable_tags_org_deliverable_tag ON deliverable_tags (organization_id, deliverable_id, tag_id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS deliverable_tags`);
  }
}
