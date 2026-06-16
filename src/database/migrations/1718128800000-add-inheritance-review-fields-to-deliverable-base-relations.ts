import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInheritanceReviewFieldsToDeliverableBaseRelations1718128800000
  implements MigrationInterface
{
  name = 'AddInheritanceReviewFieldsToDeliverableBaseRelations1718128800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE deliverable_base_relations
      ADD COLUMN IF NOT EXISTS needs_review_after_inheritance boolean NOT NULL DEFAULT true
    `);
    await queryRunner.query(`
      ALTER TABLE deliverable_base_relations
      ADD COLUMN IF NOT EXISTS reviewed_by varchar(120)
    `);
    await queryRunner.query(`
      ALTER TABLE deliverable_base_relations
      ADD COLUMN IF NOT EXISTS reviewed_at timestamptz
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE deliverable_base_relations
      DROP COLUMN IF EXISTS reviewed_at
    `);
    await queryRunner.query(`
      ALTER TABLE deliverable_base_relations
      DROP COLUMN IF EXISTS reviewed_by
    `);
    await queryRunner.query(`
      ALTER TABLE deliverable_base_relations
      DROP COLUMN IF EXISTS needs_review_after_inheritance
    `);
  }
}
