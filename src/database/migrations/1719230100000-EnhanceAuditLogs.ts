import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Enriches audit_logs to capture full action context: status (success/failed),
 * actor (who), request id, user agent, error message, and duration — plus
 * indexes on status and created_at for querying the trail.
 */
export class EnhanceAuditLogs1719230100000 implements MigrationInterface {
  name = 'EnhanceAuditLogs1719230100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "audit_logs_status_enum" AS ENUM('SUCCESS', 'FAILED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD COLUMN "status" "audit_logs_status_enum" NOT NULL DEFAULT 'SUCCESS'`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD COLUMN "actor" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD COLUMN "request_id" character varying(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD COLUMN "user_agent" character varying(512)`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD COLUMN "error_message" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD COLUMN "duration_ms" integer`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_status" ON "audit_logs" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_status"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "duration_ms"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "error_message"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "user_agent"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "request_id"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "actor"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "audit_logs_status_enum"`);
  }
}
