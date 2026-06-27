import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260624120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "mp_payment_config" (
        "id" text not null,
        "enable_cards" boolean not null default true,
        "enable_pse" boolean not null default true,
        "enable_efecty" boolean not null default true,
        "enable_manual_test" boolean not null default false,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "mp_payment_config_pkey" primary key ("id")
      );
    `)
  }
}
