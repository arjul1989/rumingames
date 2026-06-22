import { Migration } from "@medusajs/framework/mikro-orm/migrations";

// Add SEO / Open Graph override fields to articles (US-4.1 / §3.2).
export class Migration20260622223600 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "article" add column if not exists "seo_title" text null;`);
    this.addSql(`alter table if exists "article" add column if not exists "seo_description" text null;`);
    this.addSql(`alter table if exists "article" add column if not exists "og_image" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "article" drop column if exists "seo_title";`);
    this.addSql(`alter table if exists "article" drop column if exists "seo_description";`);
    this.addSql(`alter table if exists "article" drop column if exists "og_image";`);
  }

}
