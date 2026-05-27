import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandDocumentsDomainFields1716919200000 implements MigrationInterface {
  name = 'ExpandDocumentsDomainFields1716919200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD COLUMN IF NOT EXISTS "description" text
    `);

    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD COLUMN IF NOT EXISTS "type" character varying(80) NOT NULL DEFAULT 'outro'
    `);

    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD COLUMN IF NOT EXISTS "status" character varying(40) NOT NULL DEFAULT 'draft'
    `);

    await queryRunner.query(`
      UPDATE "documents"
      SET "type" = CASE
        WHEN lower("title") LIKE '%memorial%' THEN 'memorial_descritivo'
        WHEN lower("title") LIKE '%estrutural%' THEN 'projeto_estrutural'
        WHEN lower("title") LIKE '%arquitet%' THEN 'projeto_arquitetonico'
        WHEN lower("title") LIKE '%eletric%' THEN 'projeto_eletrico'
        WHEN lower("title") LIKE '%hidraulic%' OR lower("title") LIKE '%hidrossanit%' THEN 'projeto_hidrossanitario'
        WHEN lower("title") LIKE '%orcamento%' OR lower("title") LIKE '%orcament%' THEN 'orcamento'
        WHEN lower("title") LIKE '%cronograma%' THEN 'cronograma'
        WHEN lower("title") LIKE '%laudo%' THEN 'laudo'
        WHEN lower("title") LIKE '%fotografic%' THEN 'relatorio_fotografico'
        WHEN lower("title") LIKE '%art%' OR lower("title") LIKE '%rrt%' THEN 'art_rrt'
        WHEN lower("title") LIKE '%topografic%' OR lower("title") LIKE '%levantamento%' THEN 'levantamento_topografico'
        ELSE "type"
      END
    `);

    await queryRunner.query(`
      UPDATE "documents" d
      SET "status" = COALESCE(v."status", d."status")
      FROM (
        SELECT DISTINCT ON ("document_id")
          "document_id",
          CASE
            WHEN "status" = 'official' THEN 'approved'
            WHEN "status" IN ('draft', 'in_review', 'approved', 'superseded') THEN "status"
            ELSE 'draft'
          END AS "status"
        FROM "document_versions"
        ORDER BY "document_id", "is_official" DESC, "uploaded_at" DESC
      ) v
      WHERE d."id" = v."document_id"
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_documents_organization_project_status" ON "documents" ("organization_id", "project_id", "status")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_documents_organization_project_status"',
    );
    await queryRunner.query('ALTER TABLE "documents" DROP COLUMN "status"');
    await queryRunner.query('ALTER TABLE "documents" DROP COLUMN "type"');
    await queryRunner.query(
      'ALTER TABLE "documents" DROP COLUMN "description"',
    );
  }
}
