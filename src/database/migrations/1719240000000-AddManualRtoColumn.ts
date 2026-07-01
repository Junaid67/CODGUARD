import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds order_records.is_manual — flags entries created via Settings → Manual
 * RTO (a merchant-entered phone number with no real Shopify order behind it).
 */
export class AddManualRtoColumn1719240000000 implements MigrationInterface {
  name = 'AddManualRtoColumn1719240000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_records" ADD COLUMN "is_manual" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_order_records_is_manual" ON "order_records" ("shop_domain", "is_manual")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_order_records_is_manual"`);
    await queryRunner.query(`ALTER TABLE "order_records" DROP COLUMN "is_manual"`);
  }
}
