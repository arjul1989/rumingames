"use server"

import { sdk } from "@lib/config"

// Server-side data access for the community CMS (articles + streamers).
// Mirrors the Medusa store endpoints under /store/articles, /store/streamers
// and /store/feed (Epic 4 / RUM-29..33). Used by the storefront server
// components so the home and community pages can render without a client fetch.

export type ArticleStatus = "draft" | "published" | "archived"

export interface ArticleCategory {
  id: string
  name: string
  slug: string
}

export interface Streamer {
  id: string
  name: string
  slug: string
  avatar: string | null
  bio: string | null
  twitch_url: string | null
  youtube_url: string | null
  is_featured: boolean
}

export interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  body: string
  cover_image: string | null
  author: string | null
  status: ArticleStatus
  published_at: string | null
  related_product_ids: string[]
  tag_ids: string[]
  seo_title?: string | null
  seo_description?: string | null
  og_image?: string | null
  category?: ArticleCategory | null
  streamer?: Streamer | null
}

export interface RelatedProduct {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  variant_id: string | null
}

export interface ArticleTag {
  id: string
  name: string
  slug: string
}

export interface ArticleDetail extends Article {
  related_products: RelatedProduct[]
  tags: ArticleTag[]
}

export interface StreamerDetail extends Streamer {
  articles: Article[]
}

export type FeedItem =
  | { type: "article"; date: string; data: Article }
  | { type: "product"; date: string; data: Record<string, unknown> }
  | { type: "streamer_highlight"; date: string; data: Streamer }

interface ListArticlesParams {
  limit?: number
  offset?: number
  categoryId?: string
}

export const listArticles = async ({
  limit = 12,
  offset = 0,
  categoryId,
}: ListArticlesParams = {}): Promise<{ articles: Article[]; count: number }> => {
  try {
    const res = await sdk.client.fetch<{ articles: Article[]; count: number }>(
      "/store/articles",
      {
        method: "GET",
        query: {
          limit,
          offset,
          ...(categoryId ? { category_id: categoryId } : {}),
        },
        next: { revalidate: 60 },
        cache: "force-cache",
      }
    )
    return { articles: res.articles ?? [], count: res.count ?? 0 }
  } catch {
    return { articles: [], count: 0 }
  }
}

export const listArticleCategories = async (): Promise<ArticleCategory[]> => {
  try {
    const res = await sdk.client.fetch<{ categories: ArticleCategory[] }>(
      "/store/article-categories",
      { method: "GET", next: { revalidate: 300 }, cache: "force-cache" }
    )
    return res.categories ?? []
  } catch {
    return []
  }
}

interface ListStreamersParams {
  featured?: boolean
  limit?: number
  offset?: number
}

export const listStreamers = async ({
  featured,
  limit = 50,
  offset = 0,
}: ListStreamersParams = {}): Promise<{ streamers: Streamer[]; count: number }> => {
  try {
    const res = await sdk.client.fetch<{ streamers: Streamer[]; count: number }>(
      "/store/streamers",
      {
        method: "GET",
        query: {
          limit,
          offset,
          ...(featured ? { featured: "true" } : {}),
        },
        next: { revalidate: 120 },
        cache: "force-cache",
      }
    )
    return { streamers: res.streamers ?? [], count: res.count ?? 0 }
  } catch {
    return { streamers: [], count: 0 }
  }
}

export const getArticle = async (
  slug: string
): Promise<ArticleDetail | null> => {
  try {
    const res = await sdk.client.fetch<{ article: ArticleDetail }>(
      `/store/articles/${encodeURIComponent(slug)}`,
      { method: "GET", next: { revalidate: 60 }, cache: "force-cache" }
    )
    return res.article ?? null
  } catch {
    return null
  }
}

export const getStreamer = async (
  slug: string
): Promise<StreamerDetail | null> => {
  try {
    const res = await sdk.client.fetch<{ streamer: StreamerDetail }>(
      `/store/streamers/${encodeURIComponent(slug)}`,
      { method: "GET", next: { revalidate: 120 }, cache: "force-cache" }
    )
    return res.streamer ?? null
  } catch {
    return null
  }
}

export const getFeed = async ({
  limit = 20,
  offset = 0,
}: { limit?: number; offset?: number } = {}): Promise<{
  items: FeedItem[]
  count: number
}> => {
  try {
    const res = await sdk.client.fetch<{ items: FeedItem[]; count: number }>(
      "/store/feed",
      {
        method: "GET",
        query: { limit, offset },
        next: { revalidate: 30 },
        cache: "force-cache",
      }
    )
    return { items: res.items ?? [], count: res.count ?? 0 }
  } catch {
    return { items: [], count: 0 }
  }
}
