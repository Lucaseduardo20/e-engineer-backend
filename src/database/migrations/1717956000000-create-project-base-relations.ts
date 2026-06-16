import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjectBaseRelations1717956000000
  implements MigrationInterface
{
  name = 'CreateProjectBaseRelations1717956000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS project_base_relations (
        id uuid PRIMARY KEY,
        organization_id uuid NOT NULL,
        base_project_id uuid NOT NULL,
        target_project_id uuid NOT NULL,
        relation_type varchar(40) NOT NULL DEFAULT 'created_from_base',
        inherit_tags boolean NOT NULL DEFAULT true,
        inherit_deliverables boolean NOT NULL DEFAULT false,
        created_by varchar(120) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_project_base_relations_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_project_base_relations_base_project FOREIGN KEY (base_project_id) REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_project_base_relations_target_project FOREIGN KEY (target_project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_project_base_relations_org ON project_base_relations (organization_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_project_base_relations_base ON project_base_relations (organization_id, base_project_id)`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_project_base_relations_target ON project_base_relations (organization_id, target_project_id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS project_base_relations`);
  }
}
