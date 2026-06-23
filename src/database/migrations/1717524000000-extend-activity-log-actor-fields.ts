import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendActivityLogActorFields1717524000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE activity_logs
      ADD COLUMN IF NOT EXISTS actor_id varchar(120),
      ADD COLUMN IF NOT EXISTS actor_display_name varchar(120)
    `);
    await queryRunner.query(`
      UPDATE activity_logs
      SET actor_display_name = actor_name
      WHERE actor_display_name IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE activity_logs
      DROP COLUMN IF EXISTS actor_display_name,
      DROP COLUMN IF EXISTS actor_id
    `);
  }
}

