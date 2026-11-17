"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Gift, Award, Sparkles, Smartphone, CheckCircle2, ChevronDown,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import DemoModal from "./DemoModal";
import styles from "./SchedulingFeaturePage.module.css";
import { siteConfig } from "@/lib/seo";

/* ─── hero loyalty card ──────────────────────────────────── */
function HeroLoyalty() {
  return (
    <div className={styles.heroCard} aria-label="Salon Central loyalty program preview">
      <div className={styles.heroCardTop}>
        <div>
          <span>Loyalty</span>
          <strong>Gold Member</strong>
        </div>
        <button type="button">Redeem</button>
      </div>
      <div style={{ padding: 16, borderRadius: 16, background: "linear-gradient(135deg, #1e1b4b, #6d28d9 60%, #9333ea)", color: "#fff", marginBottom: 10 }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.08em", opacity: .8, marginBottom: 8 }}>POINTS BALANCE</div>
        <div style={{ fontSize: "1.7rem", fontWeight: 900 }}>2,480</div>
        <div style={{ fontSize: "0.68rem", opacity: .75, marginTop: 2 }}>≈ PKR 2,480 redeemable</div>
        <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,.2)", marginTop: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: "76%", background: "#fcd34d", borderRadius: 99 }} />
        </div>
        <div style={{ fontSize: "0.6rem", opacity: .7, marginTop: 4 }}>520 points to Platinum</div>
      </div>
      <div className={styles.floatingNote} style={{ right: -20, top: 180 }}>
        <Sparkles size={14} />
        <span>Auto-earned at every POS sale</span>
      </div>
    </div>
  );
}

/* ─── feature visuals ────────────────────────────────────── */
function TiersPanel() {
  const tiers = [
    { tier: "Bronze",   c: "#78350f", bg: "#fef9c3", min: "0 pts" },
    { tier: "Silver",   c: "#374151", bg: "#f1f5f9", min: "2,000 pts" },
    { tier: "Gold",     c: "#92400e", bg: "#fef3c7", min: "5,000 pts" },
    { tier: "Platinum", c: "#6b21a8", bg: "#f3e8ff", min: "10,000 pts" },
  ];
  return (
    <div className={styles.blockPanel}>
      <div className={styles.blockHeader} style={{ marginBottom: 14 }}>
        <Award size={16} />
        <span style={{ fontWeight: 900, color: "#17112a" }}>4 membership tiers</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tiers.map((t) => (
          <div key={t.tier} style={{ padding: "10px 12px", borderRadius: 10, background: t.bg, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 900, color: t.c }}>{t.tier}</span>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: t.c, opacity: .8 }}>{t.min}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PointsEarnPanel() {
  return (
    <div className={styles.checkoutPanel}>
      <div className={styles.clientStrip}>
        <div className={styles.avatar} style={{ background: "#9333ea22", color: "#9333ea", fontSize: "0.85rem" }}>SN</div>
        <div>
          <strong style={{ color: "#17112a", fontSize: "0.95rem" }}>Sana Nawaz</strong>
          <span>Gold Member</span>
        </div>
      </div>
      {[
        { label: "Sale Total",          value: "PKR 5,300" },
        { label: "Points Earned",       value: "+53 pts", purple: true },
        { label: "New Balance",         value: "2,480 pts" },
        { label: "Redeemable Value",    value: "≈ PKR 2,480" },
      ].map((row) => (
        <div key={row.label} className={styles.checkoutBody}>
          <div>
            <span>{row.label}</span>
            <strong style={{ color: (row as { purple?: boolean }).purple ? "#9333ea" : "#17112a" }}>{row.value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

function RedeemPanel() {
  const rows = [
    { label: "Available Points", value: "2,480 pts" },
    { label: "Redeem",           value: "1,000 pts", sub: "= PKR 1,000 off" },
    { label: "Remaining After",  value: "1,480 pts" },
  ];
  return (
    <div className={styles.staffPanel}>
      <div style={{ fontSize: "0.78rem", fontWeight: 900, color: "#17112a", marginBottom: 14 }}>Redeem at checkout</div>
      {rows.map((r) => (
        <div key={r.label} className={styles.staffRow}>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: "0.84rem", color: "#17112a" }}>{r.label}</strong>
            {r.sub && <div style={{ fontSize: "0.68rem", color: "#9ca3af" }}>{r.sub}</div>}
          </div>
          <em style={{ color: "#9333ea", fontStyle: "normal", fontWeight: 900, fontSize: "0.75rem" }}>{r.value}</em>
        </div>
      ))}
    </div>
  );
}

function WalletCardPanel() {
  return (
    <div className={styles.blockPanel}>
      <div className={styles.blockHeader} style={{ marginBottom: 14 }}>
        <Smartphone size={16} />
        <span style={{ fontWeight: 900, color: "#17112a" }}>Digital loyalty card</span>
      </div>
      <div style={{ padding: 16, borderRadius: 16, background: "linear-gradient(135deg, #1e1b4b, #6d28d9 60%, #9333ea)", color: "#fff" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.08em", opacity: .8, marginBottom: 10 }}>SALON CENTRAL LOYALTY</div>
        <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>2,480 pts</div>
        <div style={{ fontSize: "0.68rem", opacity: .75, marginTop: 2 }}>Sana Nawaz · Gold Member</div>
      </div>
      <div className={styles.blockArea} style={{ marginTop: 12 }}>
        <div style={{ padding: 12, borderRadius: 12, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: "0.74rem", fontWeight: 800, color: "#166534" }}>
          ✓ Adds to Apple &amp; Google Wallet: no app download needed
        </div>
      </div>
    </div>
  );
}

/* ─── feature rows ───────────────────────────────────────── */
const rows = [
  {
    eyebrow: "Automatic points",
    title: "Loyalty points program that rewards every salon sale",
    body: "Points are calculated and credited the moment a sale completes at POS or an appointment is marked paid. Set your own points-per-rupee rate once and every client's balance updates itself from then on.",
    visual: <PointsEarnPanel />,
  },
  {
    eyebrow: "4 membership tiers",
    title: "Salon customer loyalty program with membership tiers",
    body: "Clients climb tiers automatically as their lifetime points grow. Each tier gets a colour-coded badge on their profile, so your front desk can recognise your best clients at a glance.",
    visual: <TiersPanel />,
  },
  {
    eyebrow: "Redeemable discounts",
    title: "Loyalty points calculator for checkout discounts",
    body: "At POS, apply any amount of a client's available points as a discount on their current sale. The redeemable value and remaining balance are shown live before you confirm the payment.",
    visual: <RedeemPanel />,
  },
  {
    eyebrow: "Digital & Google Wallet cards",
    title: "Digital salon loyalty cards clients keep on their phone",
    body: "Every client gets a digital loyalty card showing their tier and points balance, with one-tap add to Apple and Google Wallet: no separate app to install, no plastic cards to print.",
    visual: <WalletCardPanel />,
  },
];

const faqs = [
  {
    q: "What is a loyalty points program for salons?",
    a: "A loyalty points program for salons rewards customers every time they book a service or purchase a product. Salon Central's loyalty points program automatically awards points that clients can redeem for discounts, free services, or exclusive offers, helping salons improve customer retention and increase repeat visits.",
  },
  {
    q: "How does Salon Central's loyalty points program work?",
    a: "Salon Central's loyalty points program automatically tracks customer spending through the salon POS and awards points based on your reward rules. It works as a complete loyalty management software that keeps customer rewards, memberships, and redemption history organized in one platform.",
  },
  {
    q: "Does Salon Central include a loyalty points calculator?",
    a: "Yes. Salon Central includes a built-in loyalty points calculator that automatically calculates how many points customers earn or redeem. You can customize reward rates, redemption values, minimum spending limits, and promotional campaigns without manual calculations.",
  },
  {
    q: "Can customers redeem loyalty points on future visits?",
    a: "Absolutely. Customers can redeem their earned points for discounts, complimentary services, or retail products during future visits. Our loyalty rewards system automatically updates the customer's available points after every redemption.",
  },
  {
    q: "Can I create a salon membership and rewards program?",
    a: "Yes. Salon Central lets you build a complete salon membership program with Bronze, Silver, Gold, and Platinum tiers. Members can receive exclusive discounts, bonus points, birthday rewards, and special promotions based on their loyalty level.",
  },
  {
    q: "Does the loyalty program work with the salon POS?",
    a: "Yes. Every sale processed through Salon Central's salon POS automatically updates your loyalty points program. Customers earn and redeem rewards directly during checkout, creating a seamless customer rewards software experience.",
  },
  {
    q: "Can I track customer loyalty and repeat visits?",
    a: "Yes. Salon Central's salon customer retention software lets you monitor loyalty points, repeat visits, membership levels, customer lifetime value, and reward redemption history. These insights help you improve customer engagement and increase repeat business.",
  },
  {
    q: "Can customers use digital loyalty cards?",
    a: "Yes. Salon Central supports digital loyalty cards that allow customers to view their points balance, membership status, and available rewards digitally. This provides a modern alternative to traditional paper loyalty cards.",
  },
  {
    q: "Is the loyalty program suitable for beauty salons and hair salons?",
    a: "Absolutely. Salon Central's loyalty points program for salons is designed for beauty salons, hair salons, spas, nail salons, barber shops, and aesthetic clinics. It helps businesses reward loyal customers while increasing customer retention and lifetime value.",
  },
  {
    q: "Why choose Salon Central's loyalty points program?",
    a: "Salon Central combines a powerful loyalty points program, loyalty points calculator, salon membership program, customer rewards software, loyalty management software, salon POS, appointment scheduling, client management, inventory, invoicing, payroll, and WhatsApp automation in one platform. It's an all-in-one solution that helps beauty salons and hair salons increase repeat customers, build long-term loyalty, and grow revenue.",
  },
];

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      style={{ maxWidth: 860, margin: "0 auto", padding: "84px 5%" }}
      aria-label="Loyalty points program FAQs"
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          FAQs
        </span>
        <h2 style={{ marginTop: 8 }}>Salon Loyalty Points Program: Frequently Asked Questions</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {faqs.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={item.q}
              style={{
                border: "1px solid #e8e8f0",
                borderRadius: 14,
                background: "#fff",
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "18px 22px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#17112a",
                }}
              >
                {item.q}
                <ChevronDown
                  size={18}
                  color="#7c3aed"
                  style={{ flexShrink: 0, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }}
                />
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

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

/* ─── page ───────────────────────────────────────────────── */
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
    { "@type": "ListItem", position: 2, name: "Features", item: `${siteConfig.url}/#features` },
    { "@type": "ListItem", position: 3, name: "Loyalty Points", item: `${siteConfig.url}/features/loyalty-points` },
  ],
};

export default function LoyaltyFeaturePage() {
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Navbar />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <div className={styles.kicker}>
                <Gift size={16} />
                Loyalty points program
              </div>
              <h1>Loyalty points program for salons</h1>
              <p>
                Salon Central awards points automatically on every sale, works as a loyalty points calculator at checkout, ranks clients through Bronze-to-Platinum tiers, and lets them redeem points for discounts with a digital card they can add straight to their phone&apos;s wallet.
              </p>
              <div className={styles.heroActions}>
                <button type="button" onClick={() => setDemoOpen(true)} className={styles.primaryCta}>
                  Get started <ArrowRight size={17} />
                </button>
                <Link href="/pricing" className={styles.secondaryCta}>View pricing</Link>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.imageChip}>
                <Image src="/salon-central-logo.png" alt="Salon Central logo" width={96} height={96} />
                <span>Salon Central Loyalty</span>
              </div>
              <HeroLoyalty />
            </div>
          </div>
          <div className={styles.wave} aria-hidden="true" />
        </section>

        <section className={styles.featureStack}>
          {rows.map((row, i) => (
            <article key={row.title} className={`${styles.featureRow} ${i % 2 ? styles.flip : ""}`}>
              <div className={styles.rowCopy}>
                <span>{row.eyebrow}</span>
                <h2>{row.title}</h2>
                <p>{row.body}</p>
              </div>
              <div className={styles.rowVisual}>{row.visual}</div>
            </article>
          ))}
        </section>

        <section className={styles.ctaBand}>
          <div>
            <span>Points, tiers, wallet cards, and POS reward tracking</span>
            <h2>Launch a salon rewards program clients remember</h2>
          </div>
          <div className={styles.ctaActions}>
            <button type="button" onClick={() => setDemoOpen(true)} className={styles.primaryCta}>
              Get started <ArrowRight size={17} />
            </button>
            <Link href="/pricing" className={styles.secondaryDark}>View pricing</Link>
          </div>
        </section>

        <section className={styles.miniStats} aria-label="Loyalty program advantages">
          <div>
            <Sparkles size={19} />
            <strong>POS reward points</strong>
            <span>Points are credited the moment a sale or appointment is marked paid.</span>
          </div>
          <div>
            <Award size={19} />
            <strong>4 tiers</strong>
            <span>Bronze, Silver, Gold, and Platinum with thresholds you control.</span>
          </div>
          <div>
            <CheckCircle2 size={19} />
            <strong>Points calculator</strong>
            <span>Apply points as a discount directly at checkout.</span>
          </div>
          <div>
            <Smartphone size={19} />
            <strong>Google Wallet</strong>
            <span>A digital card clients add to their phone in one tap.</span>
          </div>
        </section>

        <FaqSection />
      </main>
      <Footer />
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
