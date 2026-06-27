import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260627120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "country_payment_gateway" (
        "id" text not null,
        "country_code" text not null,
        "active_gateway" text check ("active_gateway" in ('mercadopago', 'wompi')) not null default 'mercadopago',
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "country_payment_gateway_pkey" primary key ("id")
      );
    `)
    this.addSql(
      `create unique index if not exists "IDX_country_payment_gateway_country_code" on "country_payment_gateway" ("country_code");`
    )
  }
}
