import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260627140000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "featured_game" ("id" text not null, "title" text not null, "slug" text not null, "excerpt" text null, "body" text null, "cover_image" text null, "status" text check ("status" in ('draft', 'published', 'archived')) not null default 'draft', "published_at" timestamptz null, "related_product_ids" jsonb not null default '[]', "home_position" integer null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "featured_game_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_featured_game_deleted_at" ON "featured_game" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_featured_game_slug_unique" ON "featured_game" ("slug") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_featured_game_status" ON "featured_game" ("status") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_featured_game_home_position" ON "featured_game" ("home_position") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "featured_game" cascade;`)
  }
}
