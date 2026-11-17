"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import DemoModal from "./DemoModal";
import styles from "./SchedulingFeaturePage.module.css";
import { siteConfig } from "@/lib/seo";

export interface VerticalFeatureRow {
  eyebrow: string;
  title: string;
  body: string;
  visual: React.ReactNode;
}

export interface VerticalStat {
  icon: React.ReactNode;
  label: string;
  body: string;
}

export interface VerticalFaq {
  q: string;
  a: string;
}

export interface VerticalPageProps {
  kickerIcon: React.ReactNode;
  kickerLabel: string;
  /** Route this page is served at, e.g. "/solutions/hair-salon" — used to build breadcrumb schema. */
  path: string;
  h1: string;
  heroParagraph: string;
  /** Themed background photo behind the hero card (a real, license-free Unsplash photo). */
  heroImage: string;
  rows: VerticalFeatureRow[];
  ctaEyebrow: string;
  ctaTitle: string;
  ctaSubtitle: string;
  stats: VerticalStat[];
  faqAriaLabel: string;
  faqTitle: string;
  faqs: VerticalFaq[];
}

function FaqSection({ title, ariaLabel, faqs }: { title: string; ariaLabel: string; faqs: VerticalFaq[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section style={{ maxWidth: 860, margin: "0 auto", padding: "84px 5%" }} aria-label={ariaLabel}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          FAQs
        </span>
        <h2 style={{ marginTop: 8 }}>{title}</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {faqs.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.q} style={{ border: "1px solid #e8e8f0", borderRadius: 14, background: "#fff", overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                  padding: "18px 22px", background: "none", border: "none", cursor: "pointer", textAlign: "left",
                  fontSize: "1rem", fontWeight: 700, color: "#17112a",
                }}
              >
                {item.q}
                <ChevronDown size={18} color="#7c3aed" style={{ flexShrink: 0, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }} />
              </button>
              {isOpen && (
                <div style={{ padding: "0 22px 20px", fontSize: "0.92rem", lineHeight: 1.65, color: "#4b4459" }}>
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function VerticalPage({
  kickerIcon, kickerLabel, path, h1, heroParagraph, heroImage,
  rows, ctaEyebrow, ctaTitle, ctaSubtitle, stats, faqAriaLabel, faqTitle, faqs,
}: VerticalPageProps) {
  const [demoOpen, setDemoOpen] = useState(false);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  // No "/solutions" hub page exists to link a middle crumb to, so this is
  // Home → this page rather than Home → Solutions → this page.
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: kickerLabel, item: `${siteConfig.url}${path}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Navbar />
      <main className={styles.page}>

        {/* ── hero ── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <div className={styles.kicker}>
                <span className={styles.kickerIconWrap}>{kickerIcon}</span>
                {kickerLabel}
              </div>
              <h1>{h1}</h1>
              <p>{heroParagraph}</p>
              <div className={styles.heroActions}>
                <button type="button" onClick={() => setDemoOpen(true)} className={styles.primaryCta}>
                  Get started <ArrowRight size={17} />
                </button>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.heroBgWrap} aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImage} alt="" className={styles.heroBgImage} />
                <div className={styles.heroBgOverlay} />
              </div>
            </div>
          </div>
          <div className={styles.wave} aria-hidden="true" />
        </section>

        {/* ── feature rows ── */}
        <section className={styles.featureStack}>
          {rows.map((row, index) => (
            <article key={row.title} className={`${styles.featureRow} ${index % 2 ? styles.flip : ""}`}>
              <div className={styles.rowCopy}>
                <span>{row.eyebrow}</span>
                <h2>{row.title}</h2>
                <p>{row.body}</p>
              </div>
              <div className={styles.rowVisual}>{row.visual}</div>
            </article>
          ))}
        </section>

        {/* ── cta band ── */}
        <section className={styles.ctaBand}>
          <div>
            <span>{ctaEyebrow}</span>
            <h2>{ctaTitle}</h2>
            <p style={{ margin: "10px 0 0", color: "rgba(255,255,255,0.78)", fontSize: "0.95rem" }}>{ctaSubtitle}</p>
          </div>
          <div className={styles.ctaActions}>
            <button type="button" onClick={() => setDemoOpen(true)} className={styles.primaryCta}>
              Get started <ArrowRight size={17} />
            </button>
            <Link href="/pricing" className={styles.secondaryDark}>
              View pricing
            </Link>
          </div>
        </section>

        {/* ── mini stats ── */}
        <section className={styles.miniStats} aria-label={`${kickerLabel} advantages`}>
          {stats.map((s) => (
            <div key={s.label}>
              {s.icon}
              <strong>{s.label}</strong>
              <span>{s.body}</span>
            </div>
          ))}
        </section>

        <FaqSection title={faqTitle} ariaLabel={faqAriaLabel} faqs={faqs} />
      </main>
      <Footer />
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
