import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260627200000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      alter table "country_payment_gateway"
      drop constraint if exists "country_payment_gateway_active_gateway_check";
    `)
    this.addSql(`
      alter table "country_payment_gateway"
      add constraint "country_payment_gateway_active_gateway_check"
      check ("active_gateway" in ('mercadopago', 'wompi', 'epayco'));
    `)

    this.addSql(`
      alter table "payment_gateway_fee"
      drop constraint if exists "payment_gateway_fee_gateway_check";
    `)
    this.addSql(`
      alter table "payment_gateway_fee"
      add constraint "payment_gateway_fee_gateway_check"
      check ("gateway" in ('mercadopago', 'wompi', 'epayco'));
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`
      alter table "country_payment_gateway"
      drop constraint if exists "country_payment_gateway_active_gateway_check";
    `)
    this.addSql(`
      alter table "country_payment_gateway"
      add constraint "country_payment_gateway_active_gateway_check"
      check ("active_gateway" in ('mercadopago', 'wompi'));
    `)

    this.addSql(`
      alter table "payment_gateway_fee"
      drop constraint if exists "payment_gateway_fee_gateway_check";
    `)
    this.addSql(`
      alter table "payment_gateway_fee"
      add constraint "payment_gateway_fee_gateway_check"
      check ("gateway" in ('mercadopago', 'wompi'));
    `)
  }
}
