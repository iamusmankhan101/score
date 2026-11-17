"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ShoppingCart,
  Receipt,
  Banknote,
  Users,
  Package,
  Sparkles,
  CalendarDays,
  Tag,
  ChevronDown,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import DemoModal from "./DemoModal";
import styles from "./SchedulingFeaturePage.module.css";
import { siteConfig } from "@/lib/seo";

/* ─── hero POS card ─────────────────────────────────────── */
function HeroPOS() {
  return (
    <div className={styles.heroCard} aria-label="Salon Central POS preview">
      <div className={styles.heroCardTop}>
        <div>
          <span>Point of Sale</span>
          <strong>New Sale</strong>
        </div>
        <button type="button">Checkout</button>
      </div>

      {/* client strip */}
      <div className={styles.clientStrip} style={{ marginBottom: 14 }}>
        <div className={styles.avatar}>SN</div>
        <div>
          <strong style={{ color: "#17112a", fontSize: "0.92rem" }}>Sana Nawaz</strong>
          <span>24 visits · PKR 186,000 lifetime</span>
        </div>
      </div>

      {/* cart rows */}
      {[
        { name: "Hair Color", type: "Service", price: "PKR 4,500", bg: "#ede9fe", dot: "#7c3aed" },
        { name: "Keratin Treatment", type: "Service", price: "PKR 6,000", bg: "#dcfce7", dot: "#059669" },
        { name: "Loreal Serum", type: "Product", price: "PKR 2,200", bg: "#fff3e4", dot: "#d97706" },
      ].map((item) => (
        <div
          key={item.name}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 12px",
            borderRadius: 12,
            background: item.bg,
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.dot, display: "inline-block" }} />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#17112a" }}>{item.name}</div>
              <div style={{ fontSize: "0.7rem", color: "#746b83" }}>{item.type}</div>
            </div>
          </div>
          <strong style={{ fontSize: "0.85rem", color: "#17112a" }}>{item.price}</strong>
        </div>
      ))}

      {/* totals */}
      <div style={{ borderTop: "1px solid #ede9fe", marginTop: 8, paddingTop: 10, display: "grid", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#746b83" }}>
          <span>Subtotal</span><span>PKR 12,700</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#059669" }}>
          <span>Discount 10%</span><span>- PKR 1,270</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", fontWeight: 900, color: "#17112a" }}>
          <span>Total</span><span>PKR 11,430</span>
        </div>
      </div>

      <div className={styles.floatingNote} style={{ right: -18, top: 210 }}>
        <Receipt size={15} />
        <span>Invoice sent via WhatsApp</span>
      </div>
    </div>
  );
}

/* ─── feature row visuals ───────────────────────────────── */
function CatalogPanel() {
  const services = [
    { name: "Hair Color", cat: "Hair", price: "PKR 4,500", dot: "#7c3aed" },
    { name: "Hydra Facial", cat: "Skin", price: "PKR 3,200", dot: "#0284c7" },
    { name: "Nail Extension", cat: "Nails", price: "PKR 2,800", dot: "#ec4899" },
    { name: "Loreal Shampoo", cat: "Product", price: "PKR 1,800", dot: "#d97706", stock: "12 left" },
  ];
  return (
    <div className={styles.staffPanel}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["All", "Services", "Products"].map((tab, i) => (
          <span
            key={tab}
            style={{
              padding: "5px 14px",
              borderRadius: 999,
              fontSize: "0.72rem",
              fontWeight: 800,
              background: i === 0 ? "#7c3aed" : "#f5f3ff",
              color: i === 0 ? "#fff" : "#5b21b6",
            }}
          >
            {tab}
          </span>
        ))}
      </div>
      {services.map((s) => (
        <div key={s.name} className={styles.staffRow}>
          <div className={styles.avatarSmall} style={{ background: s.dot + "22", color: s.dot, fontSize: "0.6rem", fontWeight: 900 }}>
            {s.cat[0]}
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: "0.88rem", color: "#17112a" }}>{s.name}</strong>
            <span style={{ fontSize: "0.7rem" }}>{s.stock ?? s.cat}</span>
          </div>
          <em>{s.price}</em>
        </div>
      ))}
    </div>
  );
}

function CartPanel() {
  return (
    <div className={styles.checkoutPanel}>
      {[
        { name: "Hair Color", qty: 1, price: "PKR 4,500" },
        { name: "Keratin Treatment", qty: 1, price: "PKR 6,000" },
      ].map((item) => (
        <div key={item.name} className={styles.checkoutBody}>
          <div>
            <span>{item.name}</span>
            <strong>× {item.qty} · {item.price}</strong>
          </div>
        </div>
      ))}
      <div style={{ display: "grid", gap: 6, padding: "10px 14px", background: "#f8f7ff", borderRadius: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#746b83" }}>
          <span>Discount type</span><strong style={{ color: "#17112a" }}>10 %</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#746b83" }}>
          <span>Subtotal</span><span>PKR 10,500</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.92rem", fontWeight: 900, color: "#17112a" }}>
          <span>Total</span><span>PKR 9,450</span>
        </div>
      </div>
      <button type="button">Process payment</button>
    </div>
  );
}

function PaymentPanel() {
  const methods = [
    { label: "Cash", color: "#059669", bg: "#dcfce7" },
    { label: "JazzCash", color: "#d97706", bg: "#fef3c7" },
    { label: "EasyPaisa", color: "#059669", bg: "#d1fae5" },
    { label: "Raast", color: "#0284c7", bg: "#dbeafe" },
    { label: "Card", color: "#7c3aed", bg: "#ede9fe" },
    { label: "Bank Transfer", color: "#374151", bg: "#f3f4f6" },
  ];
  return (
    <div className={styles.blockPanel}>
      <div className={styles.blockHeader}>
        <Banknote size={17} />
        <span>Payment method</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
        {methods.map((m) => (
          <div
            key={m.label}
            style={{
              padding: "12px 10px",
              borderRadius: 14,
              background: m.bg,
              color: m.color,
              fontWeight: 900,
              fontSize: "0.82rem",
              textAlign: "center",
              border: m.label === "Cash" ? `2px solid ${m.color}` : "none",
            }}
          >
            {m.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function ClientPanel() {
  return (
    <div className={styles.checkoutPanel}>
      <div className={styles.clientStrip}>
        <div className={styles.avatar}>SN</div>
        <div>
          <strong style={{ color: "#17112a", fontSize: "0.95rem" }}>Sana Nawaz</strong>
          <span>VIP client · Lahore</span>
        </div>
      </div>
      {[
        { label: "Total visits", value: "24" },
        { label: "Lifetime spend", value: "PKR 186,000" },
        { label: "Last visit", value: "3 days ago" },
        { label: "Loyalty points", value: "1,860 pts" },
      ].map((row) => (
        <div key={row.label} className={styles.checkoutBody}>
          <div>
            <span>{row.label}</span>
            <strong style={{ color: row.label === "Loyalty points" ? "#7c3aed" : "#17112a" }}>{row.value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

function InvoicePanel() {
  return (
    <div
      className={styles.messagesPanel}
      style={{ background: "#fff", border: "1px solid #ede9fe", borderRadius: 16, padding: 16 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "0.7rem", fontWeight: 900, color: "#746b83" }}>INVOICE</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#17112a" }}>SI-2026-0042</div>
        </div>
        <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 900 }}>PAID</span>
      </div>
      <div style={{ fontSize: "0.75rem", color: "#746b83", marginBottom: 10 }}>Sana Nawaz · Zara K. · 28 May 2026</div>
      {[
        { item: "Hair Color", amt: "PKR 4,500" },
        { item: "Keratin Treatment", amt: "PKR 6,000" },
        { item: "Discount 10%", amt: "-PKR 1,050" },
      ].map((row) => (
        <div key={row.item} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f5f3ff", fontSize: "0.8rem" }}>
          <span style={{ color: "#312a3d" }}>{row.item}</span>
          <strong style={{ color: row.amt.includes("-") ? "#059669" : "#17112a" }}>{row.amt}</strong>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: "0.9rem", fontWeight: 900, color: "#17112a" }}>
        <span>Total</span><span>PKR 9,450</span>
      </div>
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "#dcfce7", borderRadius: 10, fontSize: "0.72rem", fontWeight: 900, color: "#166534" }}>
        <Receipt size={13} /> WhatsApp receipt sent automatically
      </div>
    </div>
  );
}

function AppointmentHandoffPanel() {
  return (
    <div className={styles.checkoutPanel}>
      <div className={styles.clientStrip}>
        <div className={styles.avatar}>FK</div>
        <div>
          <strong style={{ color: "#17112a", fontSize: "0.92rem" }}>Fatima Khan</strong>
          <span>Appointment #108 · Bridal</span>
        </div>
      </div>
      {[
        { label: "Status", value: "Completed", green: true },
        { label: "Stylist", value: "Ayesha M." },
        { label: "Duration", value: "3 hrs" },
        { label: "Action", value: "Open POS ↗", purple: true },
      ].map((row) => (
        <div key={row.label} className={styles.checkoutBody}>
          <div>
            <span>{row.label}</span>
            <strong style={{ color: row.green ? "#059669" : row.purple ? "#7c3aed" : "#17112a" }}>
              {row.value}
            </strong>
          </div>
        </div>
      ))}
    </div>
  );
}

function StockPanel() {
  const items = [
    { name: "Loreal Hair Color", before: 12, after: 10, warn: false },
    { name: "Wella Developer", before: 8, after: 7, warn: false },
    { name: "Skin Serum SPF50", before: 3, after: 2, warn: true },
  ];
  return (
    <div className={styles.staffPanel}>
      <div className={styles.blockHeader} style={{ marginBottom: 10 }}>
        <Package size={16} />
        <span style={{ fontWeight: 900, fontSize: "0.82rem", color: "#17112a" }}>Stock after sale</span>
      </div>
      {items.map((it) => (
        <div key={it.name} className={styles.staffRow}>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: "0.85rem", color: "#17112a" }}>{it.name}</strong>
            <span style={{ fontSize: "0.7rem" }}>{it.before} → {it.after} units</span>
          </div>
          <em style={{ color: it.warn ? "#dc2626" : "#059669", fontStyle: "normal", fontWeight: 900, fontSize: "0.72rem" }}>
            {it.warn ? "⚠ Low" : "OK"}
          </em>
        </div>
      ))}
    </div>
  );
}

/* ─── feature rows data ─────────────────────────────────── */
const rows = [
  {
    eyebrow: "Smart catalog",
    title: "Browse services and products in one unified catalog",
    body: "Whether you're searching for POS software Pakistan trusts or point of sale Pakistan relies on, Salon Central is a salon point of sale built for every kind of salon: a true POS system for salons and hair salon POS combined. Switch between All, Services, and Products tabs to see real-time stock levels on every product, category color badges, and out-of-stock indicators, all from the POS screen without leaving checkout.",
    visual: <CatalogPanel />,
  },
  {
    eyebrow: "Instant checkout",
    title: "Build a cart, apply discounts, and collect payment in seconds",
    body: "As POS Pakistan salons expect, Salon Central's salon point of sale software lets you add any mix of services and products to the cart. Apply a flat PKR or percentage discount on the fly. The total recalculates instantly, ready to charge the moment the client is done.",
    visual: <CartPanel />,
  },
  {
    eyebrow: "6 payment methods",
    title: "Accept cash, JazzCash, EasyPaisa, Raast, card, and bank transfer",
    body: "This salon POS system doubles as a spa point of sale system, with Pakistan-first payment options built in: cash, JazzCash, EasyPaisa, Raast, card, and bank transfer. Select the method the client prefers and the sale is recorded with full payment context, no manual note-taking or separate payment tracking needed.",
    visual: <PaymentPanel />,
  },
  {
    eyebrow: "Client history",
    title: "Every sale builds a richer client profile automatically",
    body: "Every sale through this beauty salon POS, beauty salon point of sale software from check-in to checkout, updates visit count, lifetime spend, last visit date, and loyalty points automatically. Your team sees the client's full context every time they walk in, no manual updates required.",
    visual: <ClientPanel />,
  },
  {
    eyebrow: "Invoice and receipt",
    title: "Auto-numbered invoices and WhatsApp receipts sent instantly",
    body: "Built as salon point of sale system, hair salon POS software, and beauty salon POS software in one, Salon Central generates a branded invoice (SI-YEAR-XXXX format) with itemised services, products, discount, stylist name, and payment method for every sale. The receipt is sent to the client via WhatsApp automatically.",
    visual: <InvoicePanel />,
  },
  {
    eyebrow: "Inventory sync",
    title: "Product stock deducts automatically when sold at POS",
    body: "As POS software for beauty salon teams and a POS system for beauty salon inventory alike, Salon Central subtracts one unit from stock immediately when a product sells at checkout. Low-stock alerts trigger when items fall below the minimum threshold, no spreadsheet needed.",
    visual: <StockPanel />,
  },
  {
    eyebrow: "Appointment handoff",
    title: "Move a completed appointment straight to POS checkout",
    body: "Salon Central is point of sale software for hair salon and hair salon point of sale needs alike: when an appointment is marked completed, a single tap opens POS with the client, stylist, and services pre-filled. No re-entry, no delay. The front desk keeps moving.",
    visual: <AppointmentHandoffPanel />,
  },
];

const faqs = [
  {
    q: "What is salon POS software?",
    a: "Salon Central's salon POS software is a complete best salon POS system that helps beauty salons, hair salons, spas, and nail salons manage sales, payments, invoicing, inventory, and customer records from one platform. Salon Central's salon point of sale software makes it easy to process transactions, track products, and run your salon more efficiently.",
  },
  {
    q: "How does Salon Central's salon POS system work?",
    a: "Salon Central's salon point of sale system allows you to bill services and retail products in seconds. Every transaction automatically updates inventory, client history, revenue reports, and payment records. Whether you need a POS system for salons, POS system for beauty salons, or a hair salon POS system, Salon Central keeps everything connected.",
  },
  {
    q: "What payment methods does Salon Central's POS support?",
    a: "Our salon POS software supports cash, debit and credit cards, bank transfers, JazzCash, EasyPaisa, and Raast payments. Every payment is securely recorded, making Salon Central a reliable point of sale software for hair salons, beauty salons, and spas.",
  },
  {
    q: "Can I sell salon services and retail products from the same POS?",
    a: "Yes. Salon Central's salon point of sale software lets you sell salon services and retail products within a single transaction. Whether it's a haircut, hair color, manicure, facial, shampoo, or skincare product, everything is managed through one beauty salon POS software system.",
  },
  {
    q: "Does the salon POS system automatically update inventory?",
    a: "Yes. Every sale made through Salon Central's salon POS system automatically updates your stock levels. Our salon POS system software helps you track inventory, monitor product usage, receive low-stock alerts, and manage purchases without manual calculations.",
  },
  {
    q: "Can I generate invoices and receipts from the POS?",
    a: "Absolutely. Salon Central's salon point of sale system automatically generates professional invoices and receipts for every transaction. You can print receipts or share digital invoices with clients, making it a complete point of sale software for salons and POS software for beauty salons.",
  },
  {
    q: "Can I manage staff performance through the POS system?",
    a: "Yes. Every transaction processed through Salon Central's salon POS software is linked to the staff member who performed the service. This allows you to monitor sales, commissions, productivity, and revenue for each employee, making it an ideal POS system for salons with multiple staff members.",
  },
  {
    q: "Is Salon Central suitable for beauty salons, hair salons, nail salons, and spas?",
    a: "Yes. Salon Central is built for beauty salons, hair salons, nail salons, barber shops, and spas. Whether you need a beauty salon point of sale software, hair salon POS software, nail salon POS system, or a spa point of sale system, our cloud-based platform adapts to your business needs.",
  },
  {
    q: "Can I access my salon POS system from anywhere?",
    a: "Yes. Salon Central is a cloud-based point of sale solution that lets you access your salon POS system from anywhere using your computer, tablet, or mobile device. You can monitor sales, inventory, customers, and reports in real time, whether you're at the salon or away.",
  },
  {
    q: "Why choose Salon Central as your salon POS software in Pakistan?",
    a: "Salon Central is one of the best salon POS software solutions in Pakistan, combining a powerful salon point of sale system with appointment scheduling, client management, inventory management, invoicing, payroll, loyalty programs, and business analytics. Whether you're looking for POS software in Pakistan, beauty salon POS software, hair salon POS software, or a complete POS system for salons, Salon Central provides everything you need to manage and grow your salon from one platform.",
  },
];

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      style={{ maxWidth: 860, margin: "0 auto", padding: "84px 5%" }}
      aria-label="Salon POS software FAQs"
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          FAQs
        </span>
        <h2 style={{ marginTop: 8 }}>Salon POS Software: Frequently Asked Questions</h2>
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

/* ─── page ──────────────────────────────────────────────── */
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
    { "@type": "ListItem", position: 2, name: "Features", item: `${siteConfig.url}/#features` },
    { "@type": "ListItem", position: 3, name: "Point of Sale (POS)", item: `${siteConfig.url}/features/pos` },
  ],
};

export default function POSFeaturePage() {
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

        {/* ── hero ── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <div className={styles.kicker}>
                <ShoppingCart size={16} />
                Point of Sale
              </div>
              <h1>The Best POS Software in Pakistan</h1>
              <p>
                Salon Central&apos;s salon POS software handles services, products, discounts, six payment methods,
                auto-numbered invoices, WhatsApp receipts, stock deduction, and client history update, all from
                one screen. As the best POS software in Pakistan, it&apos;s a complete point of sale system built
                for beauty salons, hair salons, and spas.
              </p>
              <div className={styles.heroActions}>
                <button type="button" onClick={() => setDemoOpen(true)} className={styles.primaryCta}>
                  Get started <ArrowRight size={17} />
                </button>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.imageChip}>
                <Image src="/salon-central-logo.png" alt="Salon Central logo" width={96} height={96} />
                <span>Salon Central POS</span>
              </div>
              <HeroPOS />
            </div>
          </div>
          <div className={styles.wave} aria-hidden="true" />
        </section>

        {/* ── feature rows ── */}
        <section className={styles.featureStack}>
          {rows.map((row, index) => (
            <article
              key={row.title}
              className={`${styles.featureRow} ${index % 2 ? styles.flip : ""}`}
            >
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
            <span>Ready to upgrade your checkout?</span>
            <h2>See how fast Salon Central POS really is</h2>
            <p style={{ margin: "10px 0 0", color: "rgba(255,255,255,0.78)", fontSize: "0.95rem" }}>
              Transparent POS software price in Pakistan, no hidden fees.
            </p>
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
        <section className={styles.miniStats} aria-label="POS advantages">
          <div>
            <Banknote size={19} />
            <strong>6 payment methods</strong>
            <span>Cash, JazzCash, EasyPaisa, Raast, card, and bank transfer, all built in.</span>
          </div>
          <div>
            <Receipt size={19} />
            <strong>Auto invoices</strong>
            <span>Branded, auto-numbered invoices with WhatsApp delivery after every sale.</span>
          </div>
          <div>
            <Package size={19} />
            <strong>Live stock sync</strong>
            <span>Product inventory deducts automatically the moment a sale completes.</span>
          </div>
          <div>
            <Tag size={19} />
            <strong>Flexible discounts</strong>
            <span>Apply flat PKR or percentage discounts at checkout with instant recalculation.</span>
          </div>
        </section>

        <FaqSection />
      </main>
      <Footer />
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
