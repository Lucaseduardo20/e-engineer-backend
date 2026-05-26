import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLocalDevelopmentSchema1716746400000 implements MigrationInterface {
  name = 'CreateLocalDevelopmentSchema1716746400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" uuid NOT NULL,
        "name" character varying(160) NOT NULL,
        "legal_name" character varying(180),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_organizations_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `
      ALTER TABLE "users"
      ADD CONSTRAINT "fk_users_organization"
      FOREIGN KEY ("organization_id")
      REFERENCES "organizations"("id")
      ON DELETE RESTRICT
    `,
    );

    await queryRunner.query(`
      CREATE TABLE "memberships" (
        "id" uuid NOT NULL,
        "organization_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" character varying(40) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_memberships_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_memberships_organization_user" UNIQUE ("organization_id", "user_id"),
        CONSTRAINT "fk_memberships_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_memberships_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" uuid NOT NULL,
        "organization_id" uuid NOT NULL,
        "name" character varying(160) NOT NULL,
        "client" character varying(160),
        "project_type" character varying(120) NOT NULL,
        "status" character varying(40) NOT NULL,
        "responsible_name" character varying(120),
        "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_projects_id" PRIMARY KEY ("id"),
        CONSTRAINT "fk_projects_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_projects_organization_id" ON "projects" ("organization_id")',
    );

    await queryRunner.query(`
      CREATE TABLE "project_templates" (
        "id" uuid NOT NULL,
        "organization_id" uuid NOT NULL,
        "name" character varying(160) NOT NULL,
        "project_type" character varying(120) NOT NULL,
        "description" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_project_templates_id" PRIMARY KEY ("id"),
        CONSTRAINT "fk_project_templates_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_project_templates_organization_id" ON "project_templates" ("organization_id")',
    );

    await queryRunner.query(`
      CREATE TABLE "template_deliverables" (
        "id" uuid NOT NULL,
        "organization_id" uuid NOT NULL,
        "template_id" uuid NOT NULL,
        "name" character varying(160) NOT NULL,
        "order_index" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_template_deliverables_id" PRIMARY KEY ("id"),
        CONSTRAINT "fk_template_deliverables_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_template_deliverables_template" FOREIGN KEY ("template_id") REFERENCES "project_templates"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_template_deliverables_template_id" ON "template_deliverables" ("template_id")',
    );

    await queryRunner.query(`
      CREATE TABLE "deliverables" (
        "id" uuid NOT NULL,
        "organization_id" uuid NOT NULL,
        "project_id" uuid NOT NULL,
        "template_deliverable_id" uuid,
        "name" character varying(160) NOT NULL,
        "status" character varying(40) NOT NULL,
        "responsible_name" character varying(120),
        "due_date" date,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_deliverables_id" PRIMARY KEY ("id"),
        CONSTRAINT "fk_deliverables_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_deliverables_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_deliverables_template_deliverable" FOREIGN KEY ("template_deliverable_id") REFERENCES "template_deliverables"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_deliverables_project_id" ON "deliverables" ("project_id")',
    );

    await queryRunner.query(`
      CREATE TABLE "documents" (
        "id" uuid NOT NULL,
        "organization_id" uuid NOT NULL,
        "project_id" uuid NOT NULL,
        "deliverable_id" uuid,
        "title" character varying(180) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_documents_id" PRIMARY KEY ("id"),
        CONSTRAINT "fk_documents_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_documents_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_documents_deliverable" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "document_versions" (
        "id" uuid NOT NULL,
        "organization_id" uuid NOT NULL,
        "document_id" uuid NOT NULL,
        "revision" character varying(20) NOT NULL,
        "file_name" character varying(220) NOT NULL,
        "file_path" text NOT NULL,
        "uploaded_by" character varying(120) NOT NULL,
        "uploaded_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "is_official" boolean NOT NULL DEFAULT false,
        "status" character varying(40) NOT NULL,
        "notes" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_document_versions_id" PRIMARY KEY ("id"),
        CONSTRAINT "fk_document_versions_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_document_versions_document" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_document_versions_document_id" ON "document_versions" ("document_id")',
    );

    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id" uuid NOT NULL,
        "organization_id" uuid NOT NULL,
        "project_id" uuid NOT NULL,
        "deliverable_id" uuid,
        "document_version_id" uuid,
        "status" character varying(40) NOT NULL,
        "requested_by" character varying(120) NOT NULL,
        "reviewed_by" character varying(120),
        "due_date" date,
        "comment" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_reviews_id" PRIMARY KEY ("id"),
        CONSTRAINT "fk_reviews_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_reviews_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_reviews_deliverable" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_reviews_document_version" FOREIGN KEY ("document_version_id") REFERENCES "document_versions"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "activity_logs" (
        "id" uuid NOT NULL,
        "organization_id" uuid NOT NULL,
        "actor_name" character varying(120) NOT NULL,
        "action" character varying(80) NOT NULL,
        "entity_type" character varying(80) NOT NULL,
        "entity_id" uuid,
        "description" text NOT NULL,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_activity_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "fk_activity_logs_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_activity_logs_organization_occurred_at" ON "activity_logs" ("organization_id", "occurred_at")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX "idx_activity_logs_organization_occurred_at"',
    );
    await queryRunner.query('DROP TABLE "activity_logs"');
    await queryRunner.query('DROP TABLE "reviews"');
    await queryRunner.query('DROP INDEX "idx_document_versions_document_id"');
    await queryRunner.query('DROP TABLE "document_versions"');
    await queryRunner.query('DROP TABLE "documents"');
    await queryRunner.query('DROP INDEX "idx_deliverables_project_id"');
    await queryRunner.query('DROP TABLE "deliverables"');
    await queryRunner.query(
      'DROP INDEX "idx_template_deliverables_template_id"',
    );
    await queryRunner.query('DROP TABLE "template_deliverables"');
    await queryRunner.query(
      'DROP INDEX "idx_project_templates_organization_id"',
    );
    await queryRunner.query('DROP TABLE "project_templates"');
    await queryRunner.query('DROP INDEX "idx_projects_organization_id"');
    await queryRunner.query('DROP TABLE "projects"');
    await queryRunner.query('DROP TABLE "memberships"');
    await queryRunner.query(
      'ALTER TABLE "users" DROP CONSTRAINT "fk_users_organization"',
    );
    await queryRunner.query('DROP TABLE "organizations"');
  }
}
