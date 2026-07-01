import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema: stores, phone_profiles, store_rto_contributions,
 * order_records, audit_logs, billing_records — plus their enum types and
 * indexes. Hand-written to match the entity definitions (§4).
 *
 * UUID primary keys use gen_random_uuid() (pgcrypto). Timestamps are
 * timestamptz. Soft-delete columns (deleted_at) present on all but audit_logs.
 */
export class InitSchema1719230000000 implements MigrationInterface {
  name = 'InitSchema1719230000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // ---- Enum types -------------------------------------------------------
    await queryRunner.query(
      `CREATE TYPE "stores_plan_enum" AS ENUM('free', 'starter', 'growth', 'pro')`,
    );
    await queryRunner.query(
      `CREATE TYPE "phone_profiles_risk_level_enum" AS ENUM('low', 'medium', 'high', 'unknown')`,
    );
    await queryRunner.query(
      `CREATE TYPE "store_rto_contributions_outcome_enum" AS ENUM('DELIVERED', 'RTO', 'PENDING')`,
    );
    await queryRunner.query(
      `CREATE TYPE "order_records_risk_level_enum" AS ENUM('low', 'medium', 'high', 'unknown')`,
    );
    await queryRunner.query(
      `CREATE TYPE "order_records_outcome_enum" AS ENUM('DELIVERED', 'RTO', 'PENDING')`,
    );
    await queryRunner.query(
      `CREATE TYPE "billing_records_plan_enum" AS ENUM('free', 'starter', 'growth', 'pro')`,
    );

    // ---- stores -----------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "stores" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "shop_domain" character varying(255) NOT NULL,
        "access_token" text NOT NULL,
        "plan" "stores_plan_enum" NOT NULL DEFAULT 'free',
        "billing_id" character varying(255),
        "rto_signals" jsonb,
        "rto_tags" text array,
        "onboarding_complete" boolean NOT NULL DEFAULT false,
        "terms_accepted" boolean NOT NULL DEFAULT false,
        "terms_accepted_at" TIMESTAMP WITH TIME ZONE,
        "monthly_order_count" integer NOT NULL DEFAULT 0,
        "monthly_count_reset_at" TIMESTAMP WITH TIME ZONE,
        "last_scan_at" TIMESTAMP WITH TIME ZONE,
        "total_orders_scanned" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_stores_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_stores_shop_domain" UNIQUE ("shop_domain")
      )
    `);

    // ---- phone_profiles ---------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "phone_profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "phone_hash" character varying(64) NOT NULL,
        "phone_encrypted" text NOT NULL,
        "total_orders" integer NOT NULL DEFAULT 0,
        "delivered_count" integer NOT NULL DEFAULT 0,
        "rto_count" integer NOT NULL DEFAULT 0,
        "delivery_rate" numeric(5,2) NOT NULL DEFAULT 0,
        "contributing_store_count" integer NOT NULL DEFAULT 0,
        "risk_level" "phone_profiles_risk_level_enum" NOT NULL DEFAULT 'unknown',
        CONSTRAINT "PK_phone_profiles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_phone_profiles_phone_hash" UNIQUE ("phone_hash")
      )
    `);

    // ---- store_rto_contributions -----------------------------------------
    await queryRunner.query(`
      CREATE TABLE "store_rto_contributions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "shop_domain" character varying(255) NOT NULL,
        "phone_hash" character varying(64) NOT NULL,
        "outcome" "store_rto_contributions_outcome_enum" NOT NULL,
        "shopify_order_id" character varying(100) NOT NULL,
        "contributed_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_store_rto_contributions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_contribution_shop_order" UNIQUE ("shop_domain", "shopify_order_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_contributions_shop_domain" ON "store_rto_contributions" ("shop_domain")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contributions_phone_hash" ON "store_rto_contributions" ("phone_hash")`,
    );

    // ---- order_records ----------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "order_records" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "shop_domain" character varying(255) NOT NULL,
        "shopify_order_id" character varying(100) NOT NULL,
        "order_number" character varying(50) NOT NULL,
        "customer_name" character varying(255),
        "phone_hash" character varying(64),
        "phone_encrypted" text,
        "email" character varying(255),
        "risk_level" "order_records_risk_level_enum" NOT NULL DEFAULT 'unknown',
        "delivery_rate_at_order_time" numeric(5,2),
        "outcome" "order_records_outcome_enum" NOT NULL DEFAULT 'PENDING',
        "shopify_tags" text array,
        "shopify_financial_status" character varying(50),
        "shopify_fulfillment_status" character varying(50),
        "order_total" numeric(10,2),
        "currency" character varying(10),
        "shopify_created_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_order_records_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_order_records_shop_order" ON "order_records" ("shop_domain", "shopify_order_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_order_records_shop_domain" ON "order_records" ("shop_domain")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_order_records_phone_hash" ON "order_records" ("phone_hash")`,
    );

    // ---- audit_logs (append-only, no soft delete) ------------------------
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "shop_domain" character varying(255) NOT NULL,
        "action" character varying(100) NOT NULL,
        "metadata" jsonb,
        "ip_address" character varying(45),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_shop_domain" ON "audit_logs" ("shop_domain")`,
    );

    // ---- billing_records --------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "billing_records" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "shop_domain" character varying(255) NOT NULL,
        "shopify_subscription_id" character varying(255),
        "plan" "billing_records_plan_enum" NOT NULL,
        "status" character varying(50) NOT NULL,
        "trial_ends_at" TIMESTAMP WITH TIME ZONE,
        "billing_on" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_billing_records_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_billing_records_shop_domain" ON "billing_records" ("shop_domain")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_billing_records_shop_domain"`);
    await queryRunner.query(`DROP TABLE "billing_records"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_shop_domain"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP INDEX "IDX_order_records_phone_hash"`);
    await queryRunner.query(`DROP INDEX "IDX_order_records_shop_domain"`);
    await queryRunner.query(`DROP INDEX "IDX_order_records_shop_order"`);
    await queryRunner.query(`DROP TABLE "order_records"`);
    await queryRunner.query(`DROP INDEX "IDX_contributions_phone_hash"`);
    await queryRunner.query(`DROP INDEX "IDX_contributions_shop_domain"`);
    await queryRunner.query(`DROP TABLE "store_rto_contributions"`);
    await queryRunner.query(`DROP TABLE "phone_profiles"`);
    await queryRunner.query(`DROP TABLE "stores"`);

    await queryRunner.query(`DROP TYPE "billing_records_plan_enum"`);
    await queryRunner.query(`DROP TYPE "order_records_outcome_enum"`);
    await queryRunner.query(`DROP TYPE "order_records_risk_level_enum"`);
    await queryRunner.query(`DROP TYPE "store_rto_contributions_outcome_enum"`);
    await queryRunner.query(`DROP TYPE "phone_profiles_risk_level_enum"`);
    await queryRunner.query(`DROP TYPE "stores_plan_enum"`);
  }
}
