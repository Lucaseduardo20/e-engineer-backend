import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentTags1718388000000 implements MigrationInterface {
  name = 'CreateDocumentTags1718388000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS document_tags (
        id uuid PRIMARY KEY,
        organization_id uuid NOT NULL,
        document_id uuid NOT NULL,
        tag_id uuid NOT NULL,
        source varchar(40) NOT NULL DEFAULT 'manual',
        created_by varchar(120) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_document_tags_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_document_tags_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
        CONSTRAINT fk_document_tags_tag FOREIGN KEY (tag_id) REFERENCES technical_tags(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_document_tags_org ON document_tags (organization_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_document_tags_org_document ON document_tags (organization_id, document_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_document_tags_org_tag ON document_tags (organization_id, tag_id)`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_document_tags_org_document_tag ON document_tags (organization_id, document_id, tag_id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS document_tags`);
  }
}
