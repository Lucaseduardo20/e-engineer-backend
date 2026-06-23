import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePriorityRequests1717264800000 implements MigrationInterface {
  name = 'CreatePriorityRequests1717264800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS priority_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        target_type varchar(32) NOT NULL,
        target_id uuid NOT NULL,
        requested_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        requested_for_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        priority varchar(24) NOT NULL,
        reason text,
        status varchar(24) NOT NULL DEFAULT 'requested',
        decided_by uuid REFERENCES users(id) ON DELETE SET NULL,
        decided_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_priority_requests_target_type
          CHECK (target_type IN ('project', 'deliverable', 'review', 'document')),
        CONSTRAINT chk_priority_requests_priority
          CHECK (priority IN ('normal', 'high', 'urgent')),
        CONSTRAINT chk_priority_requests_status
          CHECK (status IN ('requested', 'applied', 'rejected'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_priority_requests_tenant_status
      ON priority_requests (organization_id, status, created_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_priority_requests_target
      ON priority_requests (organization_id, target_type, target_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS idx_priority_requests_target',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS idx_priority_requests_tenant_status',
    );
    await queryRunner.query('DROP TABLE IF EXISTS priority_requests');
  }
}
