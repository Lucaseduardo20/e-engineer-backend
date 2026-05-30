import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandKnowledgeBaseLifecycleFields1717437600000
  implements MigrationInterface
{
  name = 'ExpandKnowledgeBaseLifecycleFields1717437600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE knowledge_items
      ADD COLUMN IF NOT EXISTS visibility varchar(20) NOT NULL DEFAULT 'organization'
    `);

    await queryRunner.query(`
      ALTER TABLE knowledge_items
      ADD COLUMN IF NOT EXISTS deprecated_at timestamptz
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_knowledge_items_visibility
      ON knowledge_items (organization_id, visibility)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_knowledge_items_visibility
    `);

    await queryRunner.query(`
      ALTER TABLE knowledge_items
      DROP COLUMN IF EXISTS deprecated_at
    `);

    await queryRunner.query(`
      ALTER TABLE knowledge_items
      DROP COLUMN IF EXISTS visibility
    `);
  }
}
