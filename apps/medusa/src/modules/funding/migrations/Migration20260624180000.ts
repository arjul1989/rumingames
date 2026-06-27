import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260624180000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "funding_run" (
        "id" text not null,
        "order_id" text not null,
        "line_item_id" text not null,
        "digital_delivery_id" text null,
        "fazer_sku_id" text not null,
        "wholesale_usd" real not null,
        "idempotency_key" text not null,
        "fazer_payment_id" text null,
        "fazer_payment_method" text null,
        "fazer_pay_to" text null,
        "fazer_pay_url" text null,
        "binance_transfer_id" text null,
        "fazer_order_id" text null,
        "status" text check ("status" in (
          'pending',
          'fazer_payment_created',
          'binance_sent',
          'fazer_payment_confirmed',
          'fazer_order_placed',
          'completed',
          'failed'
        )) not null default 'pending',
        "error_message" text null,
        "completed_at" timestamptz null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "funding_run_pkey" primary key ("id")
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_funding_run_deleted_at" ON "funding_run" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_funding_run_order_id" ON "funding_run" ("order_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_funding_run_idempotency_key_unique" ON "funding_run" ("idempotency_key") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_funding_run_status" ON "funding_run" ("status") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "funding_run" cascade;`)
  }
}
