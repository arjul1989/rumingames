import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260627180000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "country_pricing_config" (
        "id" text not null,
        "country_code" text not null,
        "fx_rate" real not null default 4000,
        "local_currency_code" text not null default 'cop',
        "taxes" jsonb not null default '[]',
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "country_pricing_config_pkey" primary key ("id")
      );
    `)
    this.addSql(
      `create unique index if not exists "IDX_country_pricing_config_country_code" on "country_pricing_config" ("country_code");`
    )

    this.addSql(`
      create table if not exists "payment_gateway_fee" (
        "id" text not null,
        "country_code" text not null,
        "gateway" text check ("gateway" in ('mercadopago', 'wompi')) not null,
        "commission_pct" real not null default 0,
        "commission_fixed_local" real not null default 0,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "payment_gateway_fee_pkey" primary key ("id")
      );
    `)
    this.addSql(
      `create unique index if not exists "IDX_payment_gateway_fee_country_gateway" on "payment_gateway_fee" ("country_code", "gateway");`
    )

    this.addSql(
      `alter table "fazer_offer" add column if not exists "retail_price_usd" real null;`
    )
    this.addSql(
      `alter table "fazer_offer" add column if not exists "commission_fixed_local" real null;`
    )
  }
}
