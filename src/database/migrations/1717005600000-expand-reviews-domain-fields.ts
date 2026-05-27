import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandReviewsDomainFields1717005600000 implements MigrationInterface {
  name = 'ExpandReviewsDomainFields1717005600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reviews"
      ADD COLUMN IF NOT EXISTS "document_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews"
      ADD COLUMN IF NOT EXISTS "reviewers" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews"
      ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP WITH TIME ZONE
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews"
      ADD COLUMN IF NOT EXISTS "decision_comment" text
    `);

    await queryRunner.query(`
      UPDATE "reviews" r
      SET "document_id" = dv."document_id"
      FROM "document_versions" dv
      WHERE r."document_version_id" = dv."id"
        AND r."document_id" IS NULL
    `);

    await queryRunner.query(`
      UPDATE "reviews"
      SET "status" = CASE
        WHEN "status" IN ('approved', 'rejected', 'overdue') THEN "status"
        ELSE 'pending'
      END
    `);

    await queryRunner.query(`
      UPDATE "reviews" r
      SET "reviewers" = COALESCE(
        (
          SELECT jsonb_agg(jsonb_build_object('userId', u."id", 'role', 'reviewer'))
          FROM "users" u
          WHERE u."organization_id" = r."organization_id"
            AND (
              u."name" = r."reviewed_by"
              OR (r."reviewed_by" IS NULL AND u."name" <> r."requested_by")
            )
        ),
        '[]'::jsonb
      )
      WHERE r."reviewers" = '[]'::jsonb
    `);

    await queryRunner.query(`
      WITH fallback_reviewers AS (
        SELECT DISTINCT ON (r."id")
          r."id" AS "review_id",
          u."id" AS "user_id"
        FROM "reviews" r
        JOIN "users" u ON u."organization_id" = r."organization_id"
        WHERE r."reviewers" = '[]'::jsonb
        ORDER BY r."id", u."created_at" ASC
      )
      UPDATE "reviews" r
      SET "reviewers" = jsonb_build_array(
        jsonb_build_object('userId', f."user_id", 'role', 'reviewer')
      )
      FROM fallback_reviewers f
      WHERE r."id" = f."review_id"
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_reviews_organization_project_status" ON "reviews" ("organization_id", "project_id", "status")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_reviews_document_id" ON "reviews" ("document_id")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_reviews_document_id"');
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_reviews_organization_project_status"',
    );
    await queryRunner.query(
      'ALTER TABLE "reviews" DROP COLUMN "decision_comment"',
    );
    await queryRunner.query('ALTER TABLE "reviews" DROP COLUMN "reviewed_at"');
    await queryRunner.query('ALTER TABLE "reviews" DROP COLUMN "reviewers"');
    await queryRunner.query('ALTER TABLE "reviews" DROP COLUMN "document_id"');
  }
}
