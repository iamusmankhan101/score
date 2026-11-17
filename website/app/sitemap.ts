import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";
import { getPublishedPosts } from "@/lib/blog";

const STATIC_ROUTES: { path: string; changeFrequency: "weekly" | "monthly" | "yearly"; priority: number }[] = [
  { path: "",                                          changeFrequency: "weekly",  priority: 1.0 },
  { path: "/contact",                                  changeFrequency: "yearly",  priority: 0.6 },
  { path: "/features/appointment-scheduling",          changeFrequency: "monthly", priority: 0.8 },
  { path: "/features/client-management",               changeFrequency: "monthly", priority: 0.8 },
  { path: "/features/inventory-management",            changeFrequency: "monthly", priority: 0.8 },
  { path: "/features/invoicing",                       changeFrequency: "monthly", priority: 0.8 },
  { path: "/features/loyalty-points",                  changeFrequency: "monthly", priority: 0.8 },
  { path: "/features/online-booking",                  changeFrequency: "monthly", priority: 0.8 },
  { path: "/features/payroll-management",              changeFrequency: "monthly", priority: 0.8 },
  { path: "/features/pos",                             changeFrequency: "monthly", priority: 0.8 },
  { path: "/features/revenue-management",              changeFrequency: "monthly", priority: 0.8 },
  { path: "/features/staff-management",                changeFrequency: "monthly", priority: 0.8 },
  { path: "/features/whatsapp-reminders",               changeFrequency: "monthly", priority: 0.8 },
  { path: "/solutions/mens-salon",                     changeFrequency: "monthly", priority: 0.8 },
  { path: "/solutions/hair-salon",                     changeFrequency: "monthly", priority: 0.8 },
  { path: "/solutions/beauty-salon",                   changeFrequency: "monthly", priority: 0.8 },
  { path: "/solutions/spa",                             changeFrequency: "monthly", priority: 0.8 },
  { path: "/solutions/nail-salon",                     changeFrequency: "monthly", priority: 0.8 },
  { path: "/solutions/bridal-salon",                   changeFrequency: "monthly", priority: 0.8 },
  { path: "/solutions/aesthetic-clinic",               changeFrequency: "monthly", priority: 0.8 },
  { path: "/compare/salon-central-vs-blusha",           changeFrequency: "monthly", priority: 0.6 },
  { path: "/compare/salon-central-vs-websol",           changeFrequency: "monthly", priority: 0.6 },
  { path: "/compare/salon-central-vs-hulm",             changeFrequency: "monthly", priority: 0.6 },
  { path: "/compare/salon-central-vs-asaan-pos",        changeFrequency: "monthly", priority: 0.6 },
  { path: "/compare/salon-central-vs-oneclick",         changeFrequency: "monthly", priority: 0.6 },
  { path: "/compare/salon-central-vs-oscar",            changeFrequency: "monthly", priority: 0.6 },
  { path: "/compare/salon-central-vs-ehisabkitab",      changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog",                                     changeFrequency: "weekly",  priority: 0.7 },
  { path: "/privacy",                                   changeFrequency: "yearly",  priority: 0.3 },
  { path: "/terms",                                     changeFrequency: "yearly",  priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${siteConfig.url}${r.path}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Published blog posts are appended live — no manual sitemap edits needed
  // when a new post goes out.
  let postEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await getPublishedPosts();
    postEntries = posts.map((post) => ({
      url: `${siteConfig.url}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // If the DB is unreachable at build time, still ship the static sitemap.
  }

  return [...staticEntries, ...postEntries];
}
