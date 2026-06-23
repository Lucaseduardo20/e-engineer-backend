import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDeliverableBaseRelations1718042400000 implements MigrationInterface {
  name = 'CreateDeliverableBaseRelations1718042400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS deliverable_base_relations (
        id uuid PRIMARY KEY,
        organization_id uuid NOT NULL,
        base_project_id uuid NOT NULL,
        target_project_id uuid NOT NULL,
        base_deliverable_id uuid NOT NULL,
        target_deliverable_id uuid NOT NULL,
        relation_type varchar(40) NOT NULL DEFAULT 'inherited_from_base',
        needs_review_after_inheritance boolean NOT NULL DEFAULT true,
        reviewed_by varchar(120),
        reviewed_at timestamptz,
        created_by varchar(120) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_deliverable_base_relations_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_deliverable_base_relations_base_project FOREIGN KEY (base_project_id) REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_deliverable_base_relations_target_project FOREIGN KEY (target_project_id) REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_deliverable_base_relations_base_deliverable FOREIGN KEY (base_deliverable_id) REFERENCES deliverables(id) ON DELETE CASCADE,
        CONSTRAINT fk_deliverable_base_relations_target_deliverable FOREIGN KEY (target_deliverable_id) REFERENCES deliverables(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_deliverable_base_relations_org ON deliverable_base_relations (organization_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_deliverable_base_relations_base ON deliverable_base_relations (organization_id, base_deliverable_id)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_deliverable_base_relations_target ON deliverable_base_relations (organization_id, target_deliverable_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS deliverable_base_relations`);
  }
}
