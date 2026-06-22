import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260622165126 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "digital_delivery" ("id" text not null, "order_id" text not null, "line_item_id" text null, "fazer_order_id" text null, "code_encrypted" text null, "status" text check ("status" in ('pending', 'processing', 'delivered', 'failed', 'refunded')) not null default 'pending', "error_message" text null, "delivered_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "digital_delivery_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_digital_delivery_deleted_at" ON "digital_delivery" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_digital_delivery_order_id" ON "digital_delivery" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_digital_delivery_status" ON "digital_delivery" ("status") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "digital_delivery" cascade;`);
  }

}
