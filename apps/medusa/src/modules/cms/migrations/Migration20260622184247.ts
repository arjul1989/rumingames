import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260622184247 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop table if exists "article_article_tags" cascade;`);

    this.addSql(`alter table if exists "article" add column if not exists "tag_ids" jsonb not null default '[]';`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table if not exists "article_article_tags" ("article_id" text not null, "article_tag_id" text not null, constraint "article_article_tags_pkey" primary key ("article_id", "article_tag_id"));`);

    this.addSql(`alter table if exists "article_article_tags" add constraint "article_article_tags_article_id_foreign" foreign key ("article_id") references "article" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "article_article_tags" add constraint "article_article_tags_article_tag_id_foreign" foreign key ("article_tag_id") references "article_tag" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "article" drop column if exists "tag_ids";`);
  }

}
