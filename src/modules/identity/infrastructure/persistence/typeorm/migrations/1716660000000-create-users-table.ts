import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1716660000000 implements MigrationInterface {
  name = 'CreateUsersTable1716660000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL,
        "organization_id" uuid NOT NULL,
        "email" character varying(255) NOT NULL,
        "password" character varying(255) NOT NULL,
        "name" character varying(160) NOT NULL,
        "last_login_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_users_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX "idx_users_email_unique" ON "users" ("email")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_users_organization_id" ON "users" ("organization_id")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "idx_users_organization_id"');
    await queryRunner.query('DROP INDEX "idx_users_email_unique"');
    await queryRunner.query('DROP TABLE "users"');
  }
}
