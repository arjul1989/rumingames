import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260623153000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "fazer_category" (
        "id" text not null,
        "fazer_category_id" text not null,
        "kind" text check ("kind" in ('giftcard', 'topup')) not null,
        "name" text not null,
        "note" text null,
        "region" text null,
        "platform" text null,
        "image_url" text null,
        "enabled" boolean not null default true,
        "offer_count" integer not null default 0,
        "last_synced_at" timestamptz null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "fazer_category_pkey" primary key ("id")
      );
    `)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fazer_category_fazer_category_id_unique" ON "fazer_category" ("fazer_category_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fazer_category_platform" ON "fazer_category" ("platform") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fazer_category_region" ON "fazer_category" ("region") WHERE deleted_at IS NULL;`)

    this.addSql(`
      create table if not exists "fazer_offer" (
        "id" text not null,
        "fazer_sku_id" text not null,
        "fazer_category_id" text not null,
        "kind" text check ("kind" in ('giftcard', 'topup')) not null,
        "offer_id" text not null,
        "name" text not null,
        "wholesale_price_usd" real not null,
        "face_value_label" text not null,
        "face_value_amount" real null,
        "face_value_currency" text null,
        "stock" integer null,
        "min_order_quantity" integer null,
        "max_order_quantity" integer null,
        "field_schema" jsonb null,
        "platform" text null,
        "region" text null,
        "image_url" text null,
        "margin_pct" real not null default 15,
        "enabled" boolean not null default true,
        "status" text check ("status" in ('active', 'inactive', 'out_of_stock')) not null default 'active',
        "sale_price_cop" real null,
        "sale_price_usd" real null,
        "usd_cop_rate" real null,
        "medusa_variant_id" text null,
        "medusa_product_id" text null,
        "last_synced_at" timestamptz null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "fazer_offer_pkey" primary key ("id")
      );
    `)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fazer_offer_fazer_sku_id_unique" ON "fazer_offer" ("fazer_sku_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fazer_offer_fazer_category_id" ON "fazer_offer" ("fazer_category_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fazer_offer_platform" ON "fazer_offer" ("platform") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fazer_offer_medusa_variant_id" ON "fazer_offer" ("medusa_variant_id") WHERE deleted_at IS NULL;`)

    this.addSql(`
      create table if not exists "fazer_config" (
        "id" text not null,
        "usd_cop_rate" real not null default 4000,
        "default_margin_pct" real not null default 15,
        "last_full_sync_at" timestamptz null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "fazer_config_pkey" primary key ("id")
      );
    `)

    this.addSql(`alter table if exists "supplier_product_mapping" add column if not exists "fazer_category_id" text null;`)
    this.addSql(`alter table if exists "supplier_product_mapping" add column if not exists "kind" text check ("kind" in ('giftcard', 'topup')) null;`)
    this.addSql(`alter table if exists "supplier_product_mapping" add column if not exists "platform" text null;`)
    this.addSql(`alter table if exists "supplier_product_mapping" add column if not exists "region" text null;`)
    this.addSql(`alter table if exists "supplier_product_mapping" add column if not exists "face_value_label" text null;`)
    this.addSql(`alter table if exists "supplier_product_mapping" add column if not exists "face_value_amount" real null;`)
    this.addSql(`alter table if exists "supplier_product_mapping" add column if not exists "face_value_currency" text null;`)
    this.addSql(`alter table if exists "supplier_product_mapping" add column if not exists "image_url" text null;`)
    this.addSql(`alter table if exists "supplier_product_mapping" add column if not exists "stock" integer null;`)
    this.addSql(`alter table if exists "supplier_product_mapping" add column if not exists "enabled" boolean not null default true;`)
    this.addSql(`alter table if exists "supplier_product_mapping" add column if not exists "last_synced_price_cop" real null;`)
    this.addSql(`alter table if exists "supplier_product_mapping" add column if not exists "sale_price_usd" real null;`)
    this.addSql(`alter table if exists "supplier_product_mapping" add column if not exists "usd_cop_rate" real null;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_product_mapping_platform" ON "supplier_product_mapping" ("platform") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_product_mapping_fazer_category_id" ON "supplier_product_mapping" ("fazer_category_id") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "fazer_offer" cascade;`)
    this.addSql(`drop table if exists "fazer_category" cascade;`)
    this.addSql(`drop table if exists "fazer_config" cascade;`)
    this.addSql(`alter table if exists "supplier_product_mapping" drop column if exists "fazer_category_id";`)
    this.addSql(`alter table if exists "supplier_product_mapping" drop column if exists "kind";`)
    this.addSql(`alter table if exists "supplier_product_mapping" drop column if exists "platform";`)
    this.addSql(`alter table if exists "supplier_product_mapping" drop column if exists "region";`)
    this.addSql(`alter table if exists "supplier_product_mapping" drop column if exists "face_value_label";`)
    this.addSql(`alter table if exists "supplier_product_mapping" drop column if exists "face_value_amount";`)
    this.addSql(`alter table if exists "supplier_product_mapping" drop column if exists "face_value_currency";`)
    this.addSql(`alter table if exists "supplier_product_mapping" drop column if exists "image_url";`)
    this.addSql(`alter table if exists "supplier_product_mapping" drop column if exists "stock";`)
    this.addSql(`alter table if exists "supplier_product_mapping" drop column if exists "enabled";`)
    this.addSql(`alter table if exists "supplier_product_mapping" drop column if exists "last_synced_price_cop";`)
    this.addSql(`alter table if exists "supplier_product_mapping" drop column if exists "sale_price_usd";`)
    this.addSql(`alter table if exists "supplier_product_mapping" drop column if exists "usd_cop_rate";`)
  }
}
