import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260622183456 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "article" drop constraint if exists "article_slug_unique";`);
    this.addSql(`alter table if exists "streamer" drop constraint if exists "streamer_slug_unique";`);
    this.addSql(`alter table if exists "article_tag" drop constraint if exists "article_tag_slug_unique";`);
    this.addSql(`alter table if exists "article_category" drop constraint if exists "article_category_slug_unique";`);
    this.addSql(`create table if not exists "article_category" ("id" text not null, "name" text not null, "slug" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "article_category_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_article_category_deleted_at" ON "article_category" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_article_category_slug_unique" ON "article_category" ("slug") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "article_tag" ("id" text not null, "name" text not null, "slug" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "article_tag_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_article_tag_deleted_at" ON "article_tag" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_article_tag_slug_unique" ON "article_tag" ("slug") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "streamer" ("id" text not null, "name" text not null, "slug" text not null, "avatar" text null, "bio" text null, "twitch_url" text null, "youtube_url" text null, "is_featured" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "streamer_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_streamer_deleted_at" ON "streamer" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_streamer_slug_unique" ON "streamer" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_streamer_is_featured" ON "streamer" ("is_featured") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "article" ("id" text not null, "title" text not null, "slug" text not null, "excerpt" text null, "body" text not null, "cover_image" text null, "author" text null, "status" text check ("status" in ('draft', 'published', 'archived')) not null default 'draft', "published_at" timestamptz null, "related_product_ids" jsonb not null default '[]', "category_id" text null, "streamer_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "article_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_article_category_id" ON "article" ("category_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_article_streamer_id" ON "article" ("streamer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_article_deleted_at" ON "article" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_article_slug_unique" ON "article" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_article_status" ON "article" ("status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_article_published_at" ON "article" ("published_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "article_article_tags" ("article_id" text not null, "article_tag_id" text not null, constraint "article_article_tags_pkey" primary key ("article_id", "article_tag_id"));`);

    this.addSql(`alter table if exists "article" add constraint "article_category_id_foreign" foreign key ("category_id") references "article_category" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table if exists "article" add constraint "article_streamer_id_foreign" foreign key ("streamer_id") references "streamer" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table if exists "article_article_tags" add constraint "article_article_tags_article_id_foreign" foreign key ("article_id") references "article" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "article_article_tags" add constraint "article_article_tags_article_tag_id_foreign" foreign key ("article_tag_id") references "article_tag" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "article" drop constraint if exists "article_category_id_foreign";`);

    this.addSql(`alter table if exists "article_article_tags" drop constraint if exists "article_article_tags_article_tag_id_foreign";`);

    this.addSql(`alter table if exists "article" drop constraint if exists "article_streamer_id_foreign";`);

    this.addSql(`alter table if exists "article_article_tags" drop constraint if exists "article_article_tags_article_id_foreign";`);

    this.addSql(`drop table if exists "article_category" cascade;`);

    this.addSql(`drop table if exists "article_tag" cascade;`);

    this.addSql(`drop table if exists "streamer" cascade;`);

    this.addSql(`drop table if exists "article" cascade;`);

    this.addSql(`drop table if exists "article_article_tags" cascade;`);
  }

}
