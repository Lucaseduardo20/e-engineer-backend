import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateKnowledgeBase1717351200000 implements MigrationInterface {
  name = 'CreateKnowledgeBase1717351200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS knowledge_items (
        id uuid PRIMARY KEY,
        organization_id uuid NOT NULL,
        title varchar(180) NOT NULL,
        description text,
        type varchar(40) NOT NULL,
        status varchar(40) NOT NULL DEFAULT 'draft',
        tags jsonb NOT NULL DEFAULT '[]'::jsonb,
        content jsonb,
        created_by varchar(120) NOT NULL,
        updated_by varchar(120) NOT NULL,
        published_at timestamptz,
        archived_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_knowledge_items_organization
          FOREIGN KEY (organization_id) REFERENCES organizations(id)
          ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS knowledge_relations (
        id uuid PRIMARY KEY,
        organization_id uuid NOT NULL,
        knowledge_item_id uuid NOT NULL,
        target_type varchar(40) NOT NULL,
        target_id uuid NOT NULL,
        relation_type varchar(40) NOT NULL,
        created_by varchar(120) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_knowledge_relations_organization
          FOREIGN KEY (organization_id) REFERENCES organizations(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_knowledge_relations_item
          FOREIGN KEY (knowledge_item_id) REFERENCES knowledge_items(id)
          ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS knowledge_attachments (
        id uuid PRIMARY KEY,
        organization_id uuid NOT NULL,
        knowledge_item_id uuid NOT NULL,
        file_id uuid NOT NULL,
        label varchar(120) NOT NULL,
        description text,
        created_by varchar(120) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_knowledge_attachments_organization
          FOREIGN KEY (organization_id) REFERENCES organizations(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_knowledge_attachments_item
          FOREIGN KEY (knowledge_item_id) REFERENCES knowledge_items(id)
          ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_knowledge_items_organization ON knowledge_items (organization_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_knowledge_items_type ON knowledge_items (organization_id, type)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_knowledge_items_status ON knowledge_items (organization_id, status)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_knowledge_items_tags ON knowledge_items USING GIN (tags)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_knowledge_relations_item ON knowledge_relations (knowledge_item_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_knowledge_relations_target ON knowledge_relations (organization_id, target_type, target_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_knowledge_attachments_item ON knowledge_attachments (knowledge_item_id)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS knowledge_attachments`);
    await queryRunner.query(`DROP TABLE IF EXISTS knowledge_relations`);
    await queryRunner.query(`DROP TABLE IF EXISTS knowledge_items`);
  }
}
