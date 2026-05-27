import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandDeliverablesDomainFields1716832800000
  implements MigrationInterface
{
  name = 'ExpandDeliverablesDomainFields1716832800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "deliverables"
      ADD COLUMN IF NOT EXISTS "description" text
    `);

    await queryRunner.query(`
      ALTER TABLE "deliverables"
      ADD COLUMN IF NOT EXISTS "type" character varying(80) NOT NULL DEFAULT 'technical_report'
    `);

    await queryRunner.query(`
      ALTER TABLE "deliverables"
      ADD COLUMN IF NOT EXISTS "assignees" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);

    await queryRunner.query(`
      UPDATE "deliverables"
      SET "status" = CASE
        WHEN "status" IN ('approved', 'done') THEN 'done'
        WHEN "status" IN ('in_progress', 'in_review') THEN 'in_progress'
        WHEN "status" IN ('rejected', 'overdue', 'blocked') THEN 'blocked'
        ELSE 'todo'
      END
    `);

    await queryRunner.query(`
      UPDATE "deliverables"
      SET "type" = CASE
        WHEN lower("name") LIKE '%arquitet%' THEN 'architectural_project'
        WHEN lower("name") LIKE '%estrutural%' THEN 'structural_project'
        WHEN lower("name") LIKE '%eletric%' THEN 'electrical_project'
        WHEN lower("name") LIKE '%hidraulic%' THEN 'hydraulic_project'
        WHEN lower("name") LIKE '%drenagem%' THEN 'drainage_project'
        WHEN lower("name") LIKE '%pavimentacao%' OR lower("name") LIKE '%geometric%' THEN 'paving_project'
        WHEN lower("name") LIKE '%paisag%' THEN 'landscaping_project'
        WHEN lower("name") LIKE '%iluminacao%' THEN 'lighting_project'
        WHEN lower("name") LIKE '%memorial%' THEN 'descriptive_memorial'
        WHEN lower("name") LIKE '%orcamento%' OR lower("name") LIKE '%orcament%' THEN 'budget'
        WHEN lower("name") LIKE '%cronograma%' THEN 'schedule'
        WHEN lower("name") LIKE '%art%' OR lower("name") LIKE '%rrt%' THEN 'art_rrt'
        WHEN lower("name") LIKE '%fotografic%' THEN 'photographic_report'
        WHEN lower("name") LIKE '%levantamento%' OR lower("name") LIKE '%topografic%' THEN 'technical_survey'
        ELSE "type"
      END
    `);

    await queryRunner.query(`
      UPDATE "deliverables"
      SET "assignees" = CASE
        WHEN "responsible_name" IS NULL OR trim("responsible_name") = '' THEN '[]'::jsonb
        ELSE jsonb_build_array("responsible_name")
      END
      WHERE "assignees" = '[]'::jsonb
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_deliverables_organization_project_status" ON "deliverables" ("organization_id", "project_id", "status")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_deliverables_organization_project_status"',
    );
    await queryRunner.query('ALTER TABLE "deliverables" DROP COLUMN "assignees"');
    await queryRunner.query('ALTER TABLE "deliverables" DROP COLUMN "type"');
    await queryRunner.query('ALTER TABLE "deliverables" DROP COLUMN "description"');
  }
}
