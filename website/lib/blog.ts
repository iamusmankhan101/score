import { db } from "./db";

export type PostStatus = "draft" | "published";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentMd: string;
  coverImage: string | null;
  author: string;
  tags: string[];
  status: PostStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  /** Meta keywords for search engines — distinct from `tags`, which are the reader-facing topic labels shown on the post. */
  seoKeywords: string[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type Row = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content_md: string;
  cover_image: string | null;
  author: string;
  tags: string;
  status: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function fromRow(r: Row): BlogPost {
  let tags: string[] = [];
  try { tags = JSON.parse(r.tags); } catch { /* keep empty */ }
  let seoKeywords: string[] = [];
  try { seoKeywords = r.seo_keywords ? JSON.parse(r.seo_keywords) : []; } catch { /* keep empty */ }
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    contentMd: r.content_md,
    coverImage: r.cover_image,
    author: r.author,
    tags,
    status: r.status === "published" ? "published" : "draft",
    seoTitle: r.seo_title,
    seoDescription: r.seo_description,
    seoKeywords,
    publishedAt: r.published_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

let tableReady: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = db.execute(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id              TEXT PRIMARY KEY,
        slug            TEXT NOT NULL UNIQUE,
        title           TEXT NOT NULL,
        excerpt         TEXT NOT NULL DEFAULT '',
        content_md      TEXT NOT NULL,
        cover_image     TEXT,
        author          TEXT NOT NULL DEFAULT '',
        tags            TEXT NOT NULL DEFAULT '[]',
        status          TEXT NOT NULL DEFAULT 'draft',
        seo_title       TEXT,
        seo_description TEXT,
        published_at    TEXT,
        created_at      TEXT NOT NULL,
        updated_at      TEXT NOT NULL
      )
    `).catch(() => {
      // Table almost certainly exists already. If the DB is blocking writes (plan limit),
      // don't let this DDL take down read-only pages/builds; a real failure surfaces on the query itself.
    }).then(async () => {
      // Added after the table's initial release — backfill for any deployment
      // whose blog_posts table was created before this column existed.
      await db.execute(`ALTER TABLE blog_posts ADD COLUMN seo_keywords TEXT NOT NULL DEFAULT '[]'`).catch(() => {});
    });
  }
  return tableReady;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "post";
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  await ensureTable();
  const result = await db.execute({
    sql: "SELECT * FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC",
    args: [],
  });
  return result.rows.map((r) => fromRow(r as unknown as Row));
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  await ensureTable();
  const result = await db.execute({
    sql: "SELECT * FROM blog_posts WHERE slug = ? AND status = 'published' LIMIT 1",
    args: [slug],
  });
  if (result.rows.length === 0) return null;
  return fromRow(result.rows[0] as unknown as Row);
}

export async function getAllPostsForAdmin(): Promise<BlogPost[]> {
  await ensureTable();
  const result = await db.execute({
    sql: "SELECT * FROM blog_posts ORDER BY updated_at DESC",
    args: [],
  });
  return result.rows.map((r) => fromRow(r as unknown as Row));
}

export async function getPostByIdForAdmin(id: string): Promise<BlogPost | null> {
  await ensureTable();
  const result = await db.execute({
    sql: "SELECT * FROM blog_posts WHERE id = ? LIMIT 1",
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return fromRow(result.rows[0] as unknown as Row);
}

export interface PostInput {
  slug: string;
  title: string;
  excerpt: string;
  contentMd: string;
  coverImage: string | null;
  author: string;
  tags: string[];
  status: PostStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
}

export async function createPost(input: PostInput): Promise<BlogPost> {
  await ensureTable();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO blog_posts
            (id, slug, title, excerpt, content_md, cover_image, author, tags, status, seo_title, seo_description, seo_keywords, published_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id, input.slug, input.title, input.excerpt, input.contentMd, input.coverImage,
      input.author, JSON.stringify(input.tags), input.status, input.seoTitle, input.seoDescription,
      JSON.stringify(input.seoKeywords), input.status === "published" ? now : null, now, now,
    ],
  });
  const created = await getPostByIdForAdmin(id);
  if (!created) throw new Error("Failed to read back created post.");
  return created;
}

export async function updatePost(id: string, input: PostInput): Promise<BlogPost> {
  await ensureTable();
  const existing = await getPostByIdForAdmin(id);
  if (!existing) throw new Error("Post not found.");
  const now = new Date().toISOString();
  // A draft that's being published for the first time gets a fresh
  // publishedAt; re-saving an already-published post keeps its original date
  // rather than bumping it to "now" on every edit.
  const publishedAt = input.status === "published" ? (existing.publishedAt ?? now) : null;
  await db.execute({
    sql: `UPDATE blog_posts SET
            slug = ?, title = ?, excerpt = ?, content_md = ?, cover_image = ?, author = ?,
            tags = ?, status = ?, seo_title = ?, seo_description = ?, seo_keywords = ?, published_at = ?, updated_at = ?
          WHERE id = ?`,
    args: [
      input.slug, input.title, input.excerpt, input.contentMd, input.coverImage, input.author,
      JSON.stringify(input.tags), input.status, input.seoTitle, input.seoDescription, JSON.stringify(input.seoKeywords), publishedAt, now,
      id,
    ],
  });
  const updated = await getPostByIdForAdmin(id);
  if (!updated) throw new Error("Failed to read back updated post.");
  return updated;
}

export async function deletePost(id: string): Promise<void> {
  await ensureTable();
  await db.execute({ sql: "DELETE FROM blog_posts WHERE id = ?", args: [id] });
}

export async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  await ensureTable();
  const result = await db.execute({
    sql: excludeId
      ? "SELECT id FROM blog_posts WHERE slug = ? AND id != ? LIMIT 1"
      : "SELECT id FROM blog_posts WHERE slug = ? LIMIT 1",
    args: excludeId ? [slug, excludeId] : [slug],
  });
  return result.rows.length > 0;
}
