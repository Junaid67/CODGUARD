import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds stores.rto_note_keywords — keywords matched (case-insensitively)
 * against order notes when the NOTE RTO signal is enabled.
 */
export class AddNoteKeywordsColumn1719250000000 implements MigrationInterface {
  name = 'AddNoteKeywordsColumn1719250000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stores" ADD COLUMN "rto_note_keywords" text[]`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stores" DROP COLUMN "rto_note_keywords"`,
    );
  }
}
