import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTechnicalTags1717610400000 implements MigrationInterface {
  name = 'CreateTechnicalTags1717610400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS technical_tags (
        id uuid PRIMARY KEY,
        organization_id uuid NOT NULL,
        name varchar(120) NOT NULL,
        slug varchar(120) NOT NULL,
        category varchar(40) NOT NULL,
        description text,
        status varchar(40) NOT NULL DEFAULT 'active',
        created_by varchar(120) NOT NULL,
        updated_by varchar(120),
        archived_at timestamptz,
        deprecated_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_technical_tags_organization
          FOREIGN KEY (organization_id) REFERENCES organizations(id)
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_technical_tags_org_slug ON technical_tags (organization_id, slug)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_technical_tags_organization ON technical_tags (organization_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_technical_tags_org_category ON technical_tags (organization_id, category)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_technical_tags_org_status ON technical_tags (organization_id, status)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS technical_tags`);
  }
}
