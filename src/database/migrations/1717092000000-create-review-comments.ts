import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviewComments1717092000000 implements MigrationInterface {
  name = 'CreateReviewComments1717092000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "review_comments" (
        "id" uuid PRIMARY KEY,
        "organization_id" uuid NOT NULL,
        "review_id" uuid NOT NULL,
        "author_user_id" varchar(120) NOT NULL,
        "body" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "fk_review_comments_review"
          FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_review_comments_tenant_review"
      ON "review_comments" ("organization_id", "review_id", "created_at")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_review_comments_tenant_review"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "review_comments"');
  }
}
