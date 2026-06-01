import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateKnowledgeItemTags1717696800000 implements MigrationInterface {
  name = 'CreateKnowledgeItemTags1717696800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS knowledge_item_tags (
        id uuid PRIMARY KEY,
        organization_id uuid NOT NULL,
        knowledge_item_id uuid NOT NULL,
        tag_id uuid NOT NULL,
        created_by varchar(120) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_kit_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_kit_item FOREIGN KEY (knowledge_item_id) REFERENCES knowledge_items(id) ON DELETE CASCADE,
        CONSTRAINT fk_kit_tag FOREIGN KEY (tag_id) REFERENCES technical_tags(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_kit_org ON knowledge_item_tags (organization_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_kit_org_item ON knowledge_item_tags (organization_id, knowledge_item_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_kit_org_tag ON knowledge_item_tags (organization_id, tag_id)`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_kit_org_item_tag ON knowledge_item_tags (organization_id, knowledge_item_id, tag_id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS knowledge_item_tags`);
  }
}
