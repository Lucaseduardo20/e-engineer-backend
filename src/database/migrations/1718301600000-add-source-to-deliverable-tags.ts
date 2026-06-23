import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSourceToDeliverableTags1718301600000
  implements MigrationInterface
{
  name = 'AddSourceToDeliverableTags1718301600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE deliverable_tags
      ADD COLUMN IF NOT EXISTS source varchar(40) NOT NULL DEFAULT 'manual'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE deliverable_tags
      DROP COLUMN IF EXISTS source
    `);
  }
}
