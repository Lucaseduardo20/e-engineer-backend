import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjectTags1717869600000 implements MigrationInterface {
  name = 'CreateProjectTags1717869600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS project_tags (
        id uuid PRIMARY KEY,
        organization_id uuid NOT NULL,
        project_id uuid NOT NULL,
        tag_id uuid NOT NULL,
        source varchar(40) NOT NULL DEFAULT 'manual',
        created_by varchar(120) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_project_tags_source CHECK (source IN ('manual', 'inherited', 'suggested', 'system')),
        CONSTRAINT fk_project_tags_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_project_tags_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_project_tags_tag FOREIGN KEY (tag_id) REFERENCES technical_tags(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_project_tags_org ON project_tags (organization_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_project_tags_org_project ON project_tags (organization_id, project_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_project_tags_org_tag ON project_tags (organization_id, tag_id)`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_project_tags_org_project_tag ON project_tags (organization_id, project_id, tag_id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS project_tags`);
  }
}
