import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260622164823 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "supplier_product_mapping" drop constraint if exists "supplier_product_mapping_fazer_sku_id_unique";`);
    this.addSql(`create table if not exists "price_sync_log" ("id" text not null, "status" text check ("status" in ('success', 'partial', 'failed')) not null, "products_synced" integer not null default 0, "prices_updated" integer not null default 0, "errors" integer not null default 0, "message" text null, "started_at" timestamptz not null, "finished_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "price_sync_log_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_price_sync_log_deleted_at" ON "price_sync_log" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "supplier_product_mapping" ("id" text not null, "medusa_product_id" text not null, "medusa_variant_id" text null, "fazer_sku_id" text not null, "last_synced_price_usd" real null, "margin_pct" real not null default 15, "status" text check ("status" in ('active', 'inactive', 'out_of_stock')) not null default 'active', "last_synced_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "supplier_product_mapping_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_product_mapping_deleted_at" ON "supplier_product_mapping" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_supplier_product_mapping_fazer_sku_id_unique" ON "supplier_product_mapping" ("fazer_sku_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_product_mapping_medusa_variant_id" ON "supplier_product_mapping" ("medusa_variant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_product_mapping_status" ON "supplier_product_mapping" ("status") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "price_sync_log" cascade;`);

    this.addSql(`drop table if exists "supplier_product_mapping" cascade;`);
  }

}
