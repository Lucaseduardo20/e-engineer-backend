import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRbacProfileFields1717178400000 implements MigrationInterface {
  name = 'AddRbacProfileFields1717178400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "avatar_url" text,
      ADD COLUMN "is_platform_admin" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "organizations"
      ADD COLUMN "logo_url" text
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_users_is_platform_admin"
      ON "users" ("is_platform_admin")
      WHERE "is_platform_admin" = true
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_users_is_platform_admin"');
    await queryRunner.query('ALTER TABLE "organizations" DROP COLUMN "logo_url"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "is_platform_admin"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "avatar_url"');
  }
}
