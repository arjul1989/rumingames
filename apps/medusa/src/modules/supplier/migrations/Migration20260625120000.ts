import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260625120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "support_trace" (
        "id" text not null,
        "email" text null,
        "order_id" text null,
        "ref_type" text null,
        "ref_id" text null,
        "stage" text check ("stage" in ('storefront','payment','fazer_order','fazer_payment','email','webhook_mp','webhook_fazer','binance')) not null,
        "label" text not null,
        "endpoint" text null,
        "method" text null,
        "request_json" jsonb null,
        "response_json" jsonb null,
        "status_code" integer null,
        "error_message" text null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "support_trace_pkey" primary key ("id")
      );
    `)
    this.addSql(`create index if not exists "IDX_support_trace_email" on "support_trace" ("email");`)
    this.addSql(`create index if not exists "IDX_support_trace_order_id" on "support_trace" ("order_id");`)
    this.addSql(`create index if not exists "IDX_support_trace_created_at" on "support_trace" ("created_at");`)

    this.addSql(`
      create table if not exists "fazer_wallet_topup" (
        "id" text not null,
        "amount_usd" real not null,
        "method" text not null,
        "status" text check ("status" in ('draft','payment_created','binance_sent','awaiting_confirmation','completed','failed')) not null default 'draft',
        "idempotency_key" text not null,
        "fazer_payment_id" text null,
        "fazer_pay_to" text null,
        "fazer_pay_url" text null,
        "binance_transfer_id" text null,
        "binance_tx_id" text null,
        "error_message" text null,
        "created_by" text null,
        "confirmed_at" timestamptz null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "fazer_wallet_topup_pkey" primary key ("id")
      );
    `)
    this.addSql(`create unique index if not exists "IDX_fazer_wallet_topup_idempotency_key" on "fazer_wallet_topup" ("idempotency_key");`)
    this.addSql(`create index if not exists "IDX_fazer_wallet_topup_status" on "fazer_wallet_topup" ("status");`)
  }
}
