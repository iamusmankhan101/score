import Link from "next/link";
import { Star, Clock, Tag, ArrowRight } from "lucide-react";
import styles from "./BlogSection.module.css";
import type { BlogPost } from "@/lib/blog";

function readingTime(md: string) {
  const words = md.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "SC";
}

export default function BlogSection({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;
  const featured = posts.slice(0, 3);

  return (
    <section className={styles.section} id="blog">
      <div className={`${styles.header} text-center`}>
        <div className="section-label" data-animate data-delay="0">✦ From the Blog</div>
        <h2 className="section-title" data-animate data-delay="0.1">Tips & Guides for Salon Owners</h2>
        <p className="section-sub" data-animate data-delay="0.2" style={{ marginBottom: 0 }}>
          Insights on growing your salon, delighting clients, and running smarter operations.
        </p>
      </div>

      <div className={styles.grid}>
        {featured.map((post, i) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className={styles.card}
            data-animate
            data-delay={`${0.1 * i}`}
          >
            <div className={styles.imageWrap}>
              {post.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.coverImage} alt={post.title} className={styles.image} />
              ) : (
                <div className={styles.imagePlaceholder}>Salon Central</div>
              )}
              {i === 0 && (
                <span className={styles.badge}>
                  <Star size={12} fill="currentColor" /> Latest
                </span>
              )}
              {i !== 0 && post.tags[0] && (
                <span className={styles.badge}>{post.tags[0]}</span>
              )}
            </div>

            <div className={styles.body}>
              <h3 className={styles.title}>{post.title}</h3>
              {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}

              <div className={styles.statsRow}>
                <span className={styles.stat}>
                  <Clock size={14} /> {readingTime(post.contentMd)} min read
                </span>
                {post.tags.length > 0 && (
                  <>
                    <span className={styles.statDivider} />
                    <span className={styles.stat}>
                      <Tag size={14} /> {post.tags[0]}
                    </span>
                  </>
                )}
              </div>

              <div className={styles.footer}>
                <span className={styles.byline}>
                  <span className={styles.avatar}>{initials(post.author || "Salon Central")}</span>
                  By <span className={styles.author}>{post.author || "Salon Central"}</span>
                </span>
                <span className={styles.date}>{post.publishedAt ? timeAgo(post.publishedAt) : ""}</span>
              </div>

              <span className={styles.cta}>
                Read Article <ArrowRight size={16} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className={styles.footerCta}>
        <Link href="/blog" className="btn btn-outline btn-lg">
          View All Posts
        </Link>
      </div>
    </section>
  );
}
