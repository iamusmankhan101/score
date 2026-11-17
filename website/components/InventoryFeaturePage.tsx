"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Package, AlertTriangle, ShoppingCart,
  Tag, Search, BarChart2, Layers, ChevronDown,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import DemoModal from "./DemoModal";
import styles from "./SchedulingFeaturePage.module.css";
import { siteConfig } from "@/lib/seo";

/* ─── helpers ────────────────────────────────────────────── */
type StatusKey = "ok" | "low" | "out";
const STATUS = {
  ok:  { label: "In Stock",     c: "#059669", bg: "#dcfce7" },
  low: { label: "Low Stock",    c: "#d97706", bg: "#fef3c7" },
  out: { label: "Out of Stock", c: "#dc2626", bg: "#fef2f2" },
} as const;
const CAT = {
  "Hair Color":  { c: "#7c3aed", bg: "#ede9fe" },
  "Skin Care":   { c: "#db2777", bg: "#fdf2f8" },
  "Nail":        { c: "#0284c7", bg: "#dbeafe" },
  "Tools":       { c: "#d97706", bg: "#fef3c7" },
  "Consumables": { c: "#059669", bg: "#dcfce7" },
  "Retail":      { c: "#6b7280", bg: "#f3f4f6" },
} as const;

/* ─── hero ───────────────────────────────────────────────── */
function HeroInventory() {
  const items = [
    { name: "Loreal Hair Color 7.3", cat: "Hair Color", stock: 3,  min: 10, status: "low" as StatusKey, cost: "PKR 1,200", retail: "PKR 2,800" },
    { name: "Wella Developer 20vol", cat: "Hair Color", stock: 18, min: 10, status: "ok"  as StatusKey, cost: "PKR 480",   retail: "PKR 950" },
    { name: "OPI Nail Polish Set",   cat: "Nail",       stock: 0,  min: 5,  status: "out" as StatusKey, cost: "PKR 3,200", retail: "PKR 5,500" },
    { name: "Skin Serum SPF50",      cat: "Skin Care",  stock: 4,  min: 8,  status: "low" as StatusKey, cost: "PKR 900",   retail: "PKR 2,200" },
  ];
  return (
    <div className={styles.heroCard} aria-label="Salon Central inventory preview">
      <div className={styles.heroCardTop}>
        <div><span>Inventory</span><strong>42 Products</strong></div>
        <button type="button">Add Product</button>
      </div>

      {/* alert banner */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10, background: "#fef3c7", border: "1px solid #fcd34d", marginBottom: 12 }}>
        <AlertTriangle size={14} color="#d97706" />
        <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "#92400e" }}>5 items need attention: 2 out of stock, 3 low</span>
      </div>

      {items.map((it) => {
        const s = STATUS[it.status];
        const c = CAT[it.cat as keyof typeof CAT];
        return (
          <div key={it.name} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 8, padding: "9px 0", borderBottom: "1px solid #f5f3ff" }}>
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#17112a" }}>{it.name}</div>
              <span style={{ padding: "1px 7px", borderRadius: 999, fontSize: "0.62rem", fontWeight: 900, background: c.bg, color: c.c }}>{it.cat}</span>
            </div>
            <div style={{ textAlign: "right", fontSize: "0.72rem" }}>
              <div style={{ fontWeight: 900, color: "#17112a" }}>{it.stock} / {it.min} min</div>
              <div style={{ color: "#9ca3af" }}>cost {it.cost}</div>
            </div>
            <span style={{ padding: "3px 8px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 900, background: s.bg, color: s.c, whiteSpace: "nowrap" as const }}>{s.label}</span>
          </div>
        );
      })}

      <div className={styles.floatingNote} style={{ right: -20, top: 190 }}>
        <AlertTriangle size={13} />
        <span>WhatsApp alert sent</span>
      </div>
    </div>
  );
}

/* ─── feature visuals ────────────────────────────────────── */
function StockTrackingPanel() {
  const items = [
    { name: "Loreal Hair Color", stock: 3,  min: 10, status: "low" as StatusKey },
    { name: "Wella Developer",   stock: 18, min: 10, status: "ok"  as StatusKey },
    { name: "OPI Nail Polish",   stock: 0,  min: 5,  status: "out" as StatusKey },
    { name: "Skin Serum SPF50",  stock: 4,  min: 8,  status: "low" as StatusKey },
  ];
  return (
    <div className={styles.staffPanel}>
      <div style={{ fontSize: "0.78rem", fontWeight: 900, color: "#17112a", marginBottom: 12 }}>Live stock levels</div>
      {items.map((it) => {
        const s = STATUS[it.status];
        const pct = Math.min(100, Math.round((it.stock / (it.min * 2)) * 100));
        return (
          <div key={it.name} className={styles.staffRow}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <strong style={{ fontSize: "0.84rem", color: "#17112a" }}>{it.name}</strong>
                <span style={{ fontSize: "0.72rem", fontWeight: 900, color: s.c }}>{it.stock} pcs</span>
              </div>
              <div style={{ height: 5, background: "#f0f0f8", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: s.c, borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: "0.62rem", color: "#9ca3af", marginTop: 2 }}>Min: {it.min} · {s.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CategoriesPanel() {
  const cats = Object.entries(CAT).map(([name, { c, bg }]) => ({ name, c, bg }));
  const units = ["ml", "g", "pcs", "box", "bottle", "tube"];
  return (
    <div className={styles.blockPanel}>
      <div className={styles.blockHeader} style={{ marginBottom: 14 }}>
        <Layers size={16} />
        <span style={{ fontWeight: 900, color: "#17112a" }}>6 categories · 6 units</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 14 }}>
        {cats.map((c) => (
          <div key={c.name} style={{ padding: "8px 10px", borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.c, flexShrink: 0 }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 900, color: c.c }}>{c.name}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
        {units.map((u) => (
          <span key={u} style={{ padding: "4px 10px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 900, background: "#f5f3ff", color: "#7c3aed" }}>{u}</span>
        ))}
      </div>
    </div>
  );
}

function POSDeductPanel() {
  return (
    <div className={styles.checkoutPanel}>
      <div style={{ fontSize: "0.78rem", fontWeight: 900, color: "#17112a", marginBottom: 12 }}>Auto-deduction on POS sale</div>
      <div className={styles.clientStrip}>
        <div className={styles.avatar}>SN</div>
        <div><strong style={{ color: "#17112a", fontSize: "0.9rem" }}>Sana Nawaz</strong><span>POS Checkout</span></div>
      </div>
      {[
        { label: "Hair Color Service", type: "Service", note: "No deduction" },
        { label: "Loreal Serum ×2",   type: "Product", note: "−2 from stock", alert: true },
        { label: "OPI Nail Polish ×1", type: "Product", note: "−1 from stock", alert: true },
      ].map((row) => (
        <div key={row.label} className={styles.checkoutBody}>
          <div>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {row.label}
              <span style={{ padding: "1px 6px", borderRadius: 999, fontSize: "0.6rem", fontWeight: 900, background: row.type === "Product" ? "#fef3c7" : "#ede9fe", color: row.type === "Product" ? "#d97706" : "#7c3aed" }}>{row.type}</span>
            </span>
            <strong style={{ color: row.alert ? "#059669" : "#9ca3af", fontSize: "0.78rem" }}>{row.note}</strong>
          </div>
        </div>
      ))}
      <div style={{ padding: "9px 12px", borderRadius: 10, background: "#dcfce7", border: "1px solid #bbf7d0", fontSize: "0.73rem", fontWeight: 900, color: "#166534" }}>
        ✓ Stock updated automatically after checkout
      </div>
    </div>
  );
}

function RetailPricingPanel() {
  const items = [
    { name: "Loreal Serum",    cost: 900,  retail: 2200, listed: true  },
    { name: "OPI Nail Polish", cost: 3200, retail: 5500, listed: true  },
    { name: "Wella Developer", cost: 480,  retail: 950,  listed: false },
  ];
  return (
    <div className={styles.staffPanel}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["Stock Management", "Retail Products"].map((t, i) => (
          <span key={t} style={{ padding: "5px 12px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 900, background: i === 1 ? "#7c3aed" : "#f5f3ff", color: i === 1 ? "#fff" : "#5b21b6" }}>{t}</span>
        ))}
      </div>
      {items.map((it) => {
        const margin = Math.round(((it.retail - it.cost) / it.retail) * 100);
        return (
          <div key={it.name} className={styles.staffRow}>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: "0.84rem", color: "#17112a" }}>{it.name}</strong>
              <span style={{ fontSize: "0.68rem", color: "#9ca3af" }}>Cost PKR {it.cost.toLocaleString()} → Retail PKR {it.retail.toLocaleString()}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 900, color: "#059669" }}>{margin}% margin</div>
              <span style={{ padding: "2px 7px", borderRadius: 999, fontSize: "0.62rem", fontWeight: 900, background: it.listed ? "#dcfce7" : "#f3f4f6", color: it.listed ? "#166534" : "#6b7280" }}>
                {it.listed ? "In POS" : "Not listed"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LowStockAlertPanel() {
  return (
    <div className={styles.messagesPanel}>
      <div className={styles.messageHeader}>
        <Package size={17} />
        <span>Glow Studio · Low stock alert</span>
      </div>
      <div className={styles.chatBubble}>
        ⚠️ <strong>Low Stock Alert</strong> for Glow Studio:<br /><br />
        • Loreal Hair Color 7.3: <strong>3 pcs left</strong> (min: 10) · Supplier: Loreal Distributor<br />
        • Skin Serum SPF50: <strong>4 bottles left</strong> (min: 8) · Supplier: Skin First PK<br />
        • OPI Nail Polish Set: <strong>Out of stock</strong> (min: 5)<br /><br />
        Please restock soon.
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {[
          { label: "Sent to",   value: "Owner WhatsApp" },
          { label: "Frequency", value: "Once per item per day" },
          { label: "Trigger",   value: "Stock ≤ minimum threshold" },
        ].map((r) => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", padding: "4px 0", borderBottom: "1px solid #f5f3ff" }}>
            <span style={{ color: "#9ca3af", fontWeight: 700 }}>{r.label}</span>
            <strong style={{ color: "#17112a" }}>{r.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchFilterPanel() {
  const items = [
    { name: "Loreal Hair Color", brand: "Loreal", cat: "Hair Color", status: "low" as StatusKey },
    { name: "OPI Nail Polish",   brand: "OPI",    cat: "Nail",       status: "out" as StatusKey },
    { name: "Wella Developer",   brand: "Wella",  cat: "Hair Color", status: "ok"  as StatusKey },
  ];
  return (
    <div className={styles.staffPanel}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, background: "#f5f3ff", border: "1px solid #ede9fe", fontSize: "0.75rem", color: "#746b83" }}>
          <Search size={12} /> Search name, brand, supplier…
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" as const }}>
        {["All", "Hair Color", "Low Stock", "Out of Stock"].map((f, i) => (
          <span key={f} style={{ padding: "4px 10px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 900, background: i === 0 ? "#7c3aed" : "#f5f3ff", color: i === 0 ? "#fff" : "#5b21b6" }}>{f}</span>
        ))}
      </div>
      {items.map((it) => {
        const s = STATUS[it.status];
        const c = CAT[it.cat as keyof typeof CAT];
        return (
          <div key={it.name} className={styles.staffRow}>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: "0.84rem", color: "#17112a" }}>{it.name}</strong>
              <span style={{ fontSize: "0.68rem", color: "#9ca3af" }}>{it.brand}</span>
            </div>
            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 900, background: c.bg, color: c.c, marginRight: 6 }}>{it.cat}</span>
            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 900, background: s.bg, color: s.c }}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function StockOverviewPanel() {
  return (
    <div className={styles.checkoutPanel}>
      <div style={{ fontSize: "0.78rem", fontWeight: 900, color: "#17112a", marginBottom: 12 }}>Stock overview</div>
      {[
        { label: "Total products", value: "42",            color: "#17112a" },
        { label: "Total value",    value: "PKR 1,84,000",  color: "#059669" },
        { label: "Low stock items",value: "8",             color: "#d97706" },
        { label: "Out of stock",   value: "3",             color: "#dc2626" },
        { label: "Retail value",   value: "PKR 3,42,000",  color: "#7c3aed" },
      ].map((row) => (
        <div key={row.label} className={styles.checkoutBody}>
          <div>
            <span>{row.label}</span>
            <strong style={{ color: row.color }}>{row.value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── feature rows ───────────────────────────────────────── */
const rows = [
  {
    eyebrow: "Stock tracking",
    title: "Best inventory management software for live stock tracking",
    body: "Each inventory item has a current stock and a minimum stock threshold you define. Salon Central colour-codes every item as In Stock (green), Low Stock (orange), or Out of Stock (red), instantly visible across the inventory list.",
    visual: <StockTrackingPanel />,
  },
  {
    eyebrow: "6 categories · 6 units",
    title: "Beauty salon stock management by category and unit",
    body: "Assign each product to one of six categories: Hair Color, Skin Care, Nail, Tools, Consumables, or Retail, and track it in the right unit (ml, g, pcs, box, bottle, or tube). Category badges appear everywhere for instant visual recognition.",
    visual: <CategoriesPanel />,
  },
  {
    eyebrow: "POS auto-deduction",
    title: "POS inventory management software connected to checkout",
    body: "When a product is added to a POS sale and the client checks out, Salon Central reduces its inventory count immediately. For salons comparing the best software for billing and inventory management, POS sales, stock updates, and product revenue stay connected.",
    visual: <POSDeductPanel />,
  },
  {
    eyebrow: "Retail pricing",
    title: "Accounting and inventory management software for retail products",
    body: "Add a retail price to any inventory item and toggle it live in the POS catalog. The retail tab shows your cost price, retail price, and profit margin per item. Products without a retail price stay in stock management only and never appear at checkout.",
    visual: <RetailPricingPanel />,
  },
  {
    eyebrow: "WhatsApp low-stock alerts",
    title: "Low-stock alert software for salon products",
    body: "When any item's stock falls to or below its minimum threshold, Salon Central sends a single daily WhatsApp alert to the salon owner. The message lists every low or out-of-stock item with its current quantity, minimum, and supplier name.",
    visual: <LowStockAlertPanel />,
  },
  {
    eyebrow: "Search and filter",
    title: "Supplier and product inventory search for salons",
    body: "Search across all inventory by product name, brand, or supplier. Filter by category or stock status, or combine both to see only Low Stock Hair Color items, for example. The overview cards always show total value, low-stock count, and out-of-stock count.",
    visual: <SearchFilterPanel />,
  },
  {
    eyebrow: "Stock overview",
    title: "Cloud based inventory management software with reports",
    body: "The inventory dashboard shows total product count, total cost value (cost × stock), how many items are low or out of stock, and total retail value of listed products, updated the moment any sale or restock is recorded.",
    visual: <StockOverviewPanel />,
  },
];

const faqs = [
  {
    q: "What is salon inventory software?",
    a: "Salon inventory software helps beauty salons, hair salons, spas, and barber shops track products, monitor stock levels, manage purchases, and reduce inventory waste. Salon Central's salon inventory software automatically updates stock after every sale, helping you keep accurate inventory records.",
  },
  {
    q: "How does Salon Central's inventory management software work?",
    a: "Salon Central's inventory management software automatically deducts products whenever a sale is made through the salon POS. You can track inventory in real time, receive low-stock alerts, manage suppliers, and monitor product movement from one dashboard.",
  },
  {
    q: "Is Salon Central a cloud-based inventory management software?",
    a: "Yes. Salon Central is a cloud based inventory management software, allowing you to monitor inventory, stock levels, purchases, and reports from anywhere. Whether you're managing one salon or multiple branches, your inventory data stays synchronized in real time.",
  },
  {
    q: "Can I manage retail products and salon supplies?",
    a: "Absolutely. Salon Central's salon inventory software helps you manage retail products, professional salon supplies, hair color, skincare products, and consumables. Every product movement is tracked automatically, giving you complete control over your inventory.",
  },
  {
    q: "Does the software send low-stock alerts?",
    a: "Yes. Salon Central's inventory management software automatically notifies you when products reach minimum stock levels. This helps salon owners reorder products on time, prevent stock shortages, and avoid interruptions to daily salon operations.",
  },
  {
    q: "Does inventory automatically sync with the salon POS?",
    a: "Yes. Every transaction processed through Salon Central's salon POS automatically updates your inventory. This integration makes Salon Central an excellent accounting and inventory management software solution by keeping sales, inventory, invoicing, and financial records synchronized.",
  },
  {
    q: "Can I manage inventory and billing from one system?",
    a: "Yes. Salon Central combines inventory management with salon POS, invoicing, and billing. If you're looking for the best software for billing and inventory management, you can manage products, invoices, payments, and stock without switching between multiple systems.",
  },
  {
    q: "Is Salon Central suitable for salons in Pakistan?",
    a: "Yes. Salon Central is built specifically for beauty salons, hair salons, spas, and barber shops across Pakistan. If you're searching for inventory management software Pakistan, our cloud-based platform helps you track inventory, monitor stock, and manage your salon more efficiently.",
  },
  {
    q: "Is Salon Central suitable for small salons?",
    a: "Absolutely. Whether you're a startup salon or an established business, Salon Central is one of the best inventory management software for small businesses in the beauty industry. It helps you reduce inventory losses, improve stock accuracy, and save valuable time.",
  },
  {
    q: "Why choose Salon Central as your inventory management software?",
    a: "Salon Central is one of the best inventory management software solutions for beauty salons, hair salons, spas, and barber shops. It combines salon inventory software, cloud based inventory management software, salon POS, invoicing, client management, payroll, revenue reporting, loyalty programs, and WhatsApp automation into one powerful salon management platform.",
  },
];

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      style={{ maxWidth: 860, margin: "0 auto", padding: "84px 5%" }}
      aria-label="Inventory management FAQs"
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          FAQs
        </span>
        <h2 style={{ marginTop: 8 }}>Salon Inventory Management Software: Frequently Asked Questions</h2>
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
    { "@type": "ListItem", position: 3, name: "Inventory Management", item: `${siteConfig.url}/features/inventory-management` },
  ],
};

export default function InventoryFeaturePage() {
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
                <Package size={16} />
                Inventory management software Pakistan
              </div>
              <h1>Best inventory management software for salon businesses</h1>
              <p>
                Salon Central is salon inventory software and spa inventory management software for beauty salons, hair salons, and spas in Pakistan. It works like the best inventory management software for small businesses, tracking product stock, supplier details, minimum thresholds, cost and retail prices, POS auto-deduction, and WhatsApp alerts when anything runs low.
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
                <span>Salon Central Inventory</span>
              </div>
              <HeroInventory />
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
            <span>Cloud inventory, billing, accounting, suppliers, and reports in one dashboard</span>
            <h2>Use inventory management software Pakistan salons and small businesses can run daily</h2>
          </div>
          <div className={styles.ctaActions}>
            <button type="button" onClick={() => setDemoOpen(true)} className={styles.primaryCta}>
              Get started <ArrowRight size={17} />
            </button>
            <Link href="/pricing" className={styles.secondaryDark}>View pricing</Link>
          </div>
        </section>

        <section className={styles.miniStats} aria-label="Inventory management advantages">
          <div>
            <AlertTriangle size={19} />
            <strong>Low-stock alerts</strong>
            <span>Daily WhatsApp alert to the owner when any product hits its minimum threshold.</span>
          </div>
          <div>
            <ShoppingCart size={19} />
            <strong>Salon POS inventory</strong>
            <span>Stock drops automatically the moment a product is sold at checkout.</span>
          </div>
          <div>
            <Tag size={19} />
            <strong>Retail stock control</strong>
            <span>Set retail prices, view margins, and connect billing with inventory.</span>
          </div>
          <div>
            <BarChart2 size={19} />
            <strong>Inventory reports</strong>
            <span>Cost value and retail value of your full inventory, always up to date.</span>
          </div>
        </section>

        <FaqSection />
      </main>
      <Footer />
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
