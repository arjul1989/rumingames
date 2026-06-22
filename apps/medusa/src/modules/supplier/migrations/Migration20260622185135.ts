import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260622185135 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "price_sync_log" add column if not exists "usd_cop_rate" integer null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "price_sync_log" drop column if exists "usd_cop_rate";`);
  }

}
