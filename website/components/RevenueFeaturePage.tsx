"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  TrendingUp,
  ArrowUpRight,
  CreditCard,
  Wallet,
  CalendarDays,
  Download,
  BarChart2,
  Scissors,
  ChevronDown,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import DemoModal from "./DemoModal";
import styles from "./SchedulingFeaturePage.module.css";
import { siteConfig } from "@/lib/seo";

/* ─── hero revenue card ──────────────────────────────────── */
function HeroRevenue() {
  const bars = [
    { label: "Mon", h: 38 }, { label: "Tue", h: 62 }, { label: "Wed", h: 55 },
    { label: "Thu", h: 80 }, { label: "Fri", h: 95 }, { label: "Sat", h: 72 },
    { label: "Sun", h: 20 },
  ];

  return (
    <div className={styles.heroCard} aria-label="Salon Central revenue dashboard preview">
      <div className={styles.heroCardTop}>
        <div>
          <span>Revenue</span>
          <strong>May 2026</strong>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["7d", "30d", "1y"].map((p, i) => (
            <span key={p} style={{ padding: "4px 10px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 900, background: i === 1 ? "#7c3aed" : "#f5f3ff", color: i === 1 ? "#fff" : "#5b21b6" }}>{p}</span>
          ))}
        </div>
      </div>

      {/* stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { label: "Total Revenue", value: "PKR 4,86,000", trend: "+18.4%", up: true, color: "#7c3aed" },
          { label: "Appointments", value: "142",           trend: "+12.1%", up: true, color: "#0284c7" },
          { label: "Avg Ticket",   value: "PKR 3,422",     trend: "+5.6%",  up: true, color: "#059669" },
          { label: "Est. Tips",    value: "PKR 38,880",    trend: "-2.1%",  up: false, color: "#d97706" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "10px 12px", borderRadius: 12, background: "#f8f7ff", border: "1px solid #ede9fe" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 900, color: "#746b83", marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: "0.9rem", fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.62rem", fontWeight: 900, color: s.up ? "#059669" : "#ef4444", marginTop: 2 }}>
              {s.up ? "▲" : "▼"} {s.trend} vs prev
            </div>
          </div>
        ))}
      </div>

      {/* bar chart */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, paddingTop: 4 }}>
        {bars.map((b) => (
          <div key={b.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: b.label === "Fri" ? "#7c3aed" : "#ddd6fe", height: `${b.h}%` }} />
            <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "#746b83" }}>{b.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.floatingNote} style={{ right: -22, top: 160 }}>
        <Download size={14} />
        <span>Export PDF</span>
      </div>
    </div>
  );
}

/* ─── feature row visuals ───────────────────────────────── */
function PeriodComparisonPanel() {
  return (
    <div className={styles.checkoutPanel}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[
          { label: "7 Days", active: false },
          { label: "14 Days", active: false },
          { label: "Month", active: true },
          { label: "1 Year", active: false },
        ].map(({ label, active }) => (
          <span key={label} style={{ padding: "6px 12px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 900, background: active ? "#7c3aed" : "#f5f3ff", color: active ? "#fff" : "#5b21b6", cursor: "pointer" }}>
            {label}
          </span>
        ))}
      </div>
      {[
        { label: "Revenue",     curr: "PKR 4,86,000", prev: "PKR 4,11,000", up: true,  pct: "+18.4%" },
        { label: "Appointments", curr: "142",          prev: "127",          up: true,  pct: "+11.8%" },
        { label: "Avg Ticket",  curr: "PKR 3,422",    prev: "PKR 3,236",    up: true,  pct: "+5.7%"  },
      ].map((row) => (
        <div key={row.label} className={styles.checkoutBody}>
          <div>
            <span>{row.label}</span>
            <div style={{ textAlign: "right" }}>
              <strong style={{ color: "#17112a", display: "block" }}>{row.curr}</strong>
              <span style={{ fontSize: "0.65rem", fontWeight: 900, color: row.up ? "#059669" : "#ef4444" }}>
                {row.up ? "▲" : "▼"} {row.pct} vs prev period
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BarChartPanel() {
  const months = [
    { label: "Nov", h: 45 }, { label: "Dec", h: 58 }, { label: "Jan", h: 52 },
    { label: "Feb", h: 63 }, { label: "Mar", h: 71 }, { label: "Apr", h: 82 },
    { label: "May", h: 95 }, { label: "Jun", h: 68 },
  ];
  return (
    <div className={styles.blockPanel} style={{ paddingBottom: 0 }}>
      <div className={styles.blockHeader} style={{ marginBottom: 16 }}>
        <TrendingUp size={17} />
        <span style={{ fontWeight: 900, color: "#17112a" }}>Monthly revenue trend</span>
      </div>
      {/* y-axis + bars */}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: "0.58rem", fontWeight: 700, color: "#9ca3af", paddingBottom: 20 }}>
          {["500K", "375K", "250K", "125K", "0"].map((v) => <span key={v}>{v}</span>)}
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 5, height: 120, borderBottom: "1px solid #f0f0f8" }}>
          {months.map((b) => (
            <div key={b.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: b.label === "May" ? "#7c3aed" : "#ddd6fe", height: `${b.h}%`, cursor: "pointer", transition: "opacity .15s" }} />
              <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "#746b83" }}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#7c3aed", marginTop: 10, textAlign: "center" }}>
        Click any bar to drill down into daily detail
      </div>
    </div>
  );
}

function PaymentBreakdownPanel() {
  const methods = [
    { label: "Cash",          pct: 48, color: "#22c55e",  bg: "#dcfce7",  amt: "PKR 2,33,280" },
    { label: "JazzCash",      pct: 22, color: "#f97316",  bg: "#ffedd5",  amt: "PKR 1,06,920" },
    { label: "EasyPaisa",     pct: 14, color: "#10b981",  bg: "#d1fae5",  amt: "PKR 68,040" },
    { label: "Card",          pct: 10, color: "#6366f1",  bg: "#e0e7ff",  amt: "PKR 48,600" },
    { label: "Raast",         pct: 4,  color: "#3b82f6",  bg: "#dbeafe",  amt: "PKR 19,440" },
    { label: "Bank Transfer", pct: 2,  color: "#9333ea",  bg: "#f3e8ff",  amt: "PKR 9,720" },
  ];
  return (
    <div className={styles.staffPanel}>
      <div style={{ fontSize: "0.78rem", fontWeight: 900, color: "#17112a", marginBottom: 14 }}>Revenue by payment method</div>
      {methods.map((m) => (
        <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#17112a" }}>{m.label}</span>
              <span style={{ fontSize: "0.72rem", fontWeight: 900, color: m.color }}>{m.pct}%</span>
            </div>
            <div style={{ height: 5, background: "#f0f0f8", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${m.pct}%`, background: m.color, borderRadius: 99 }} />
            </div>
          </div>
          <span style={{ fontSize: "0.7rem", fontWeight: 900, color: "#746b83", width: 72, textAlign: "right" }}>{m.amt}</span>
        </div>
      ))}
    </div>
  );
}

function TopServicesPanel() {
  const services = [
    { rank: 1, name: "Hair Color",        count: 38, rev: "PKR 1,71,000", w: 100, color: "#7C3AED" },
    { rank: 2, name: "Bridal Makeup",     count: 12, rev: "PKR 2,16,000", w: 80,  color: "#9333EA" },
    { rank: 3, name: "Keratin Treatment", count: 24, rev: "PKR 1,44,000", w: 65,  color: "#A78BFA" },
    { rank: 4, name: "Hydra Facial",      count: 31, rev: "PKR 99,200",   w: 45,  color: "#c4b5fd" },
    { rank: 5, name: "Nail Extension",    count: 19, rev: "PKR 53,200",   w: 28,  color: "#ddd6fe" },
  ];
  return (
    <div className={styles.staffPanel}>
      <div style={{ fontSize: "0.78rem", fontWeight: 900, color: "#17112a", marginBottom: 14 }}>Top services by revenue</div>
      {services.map((s) => (
        <div key={s.name} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 18, height: 18, borderRadius: 6, background: s.color + "22", color: s.color, fontSize: "0.62rem", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.rank}</span>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#17112a" }}>{s.name}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 900, color: "#17112a" }}>{s.rev}</div>
              <div style={{ fontSize: "0.65rem", color: "#746b83" }}>{s.count}× performed</div>
            </div>
          </div>
          <div style={{ height: 5, background: "#f0f0f8", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${s.w}%`, background: s.color, borderRadius: 99 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DailyTablePanel() {
  const rows = [
    { date: "31 May", dow: "Sat", appts: 8, rev: "PKR 28,400", today: true },
    { date: "30 May", dow: "Fri", appts: 12, rev: "PKR 42,600", today: false },
    { date: "29 May", dow: "Thu", appts: 9,  rev: "PKR 33,200", today: false },
    { date: "28 May", dow: "Wed", appts: 11, rev: "PKR 38,500", today: false },
  ];
  return (
    <div className={styles.staffPanel}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 60px 1fr", padding: "6px 10px", background: "#f5f3ff", borderRadius: 8, marginBottom: 8, fontSize: "0.65rem", fontWeight: 900, color: "#746b83", gap: 8 }}>
        <span>DATE</span><span>DAY</span><span>APPTS</span><span>REVENUE</span>
      </div>
      {rows.map((row) => (
        <div key={row.date} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 60px 1fr", padding: "8px 10px", borderRadius: 8, background: row.today ? "#f0f0fd" : "transparent", border: `1px solid ${row.today ? "#c4b5fd" : "transparent"}`, marginBottom: 4, gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: row.today ? 900 : 700, color: "#17112a" }}>{row.date}</span>
            {row.today && <span style={{ padding: "1px 7px", borderRadius: 999, fontSize: "0.6rem", fontWeight: 900, background: "#7c3aed", color: "#fff" }}>Today</span>}
          </div>
          <span style={{ fontSize: "0.78rem", color: "#746b83" }}>{row.dow}</span>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#17112a" }}>{row.appts}</span>
          <span style={{ fontSize: "0.8rem", fontWeight: 900, color: "#7c3aed" }}>{row.rev}</span>
        </div>
      ))}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 60px 1fr", padding: "8px 10px", borderTop: "2px solid #ede9fe", marginTop: 4, gap: 8 }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "#17112a" }}>Total (4 days)</span>
        <span />
        <span style={{ fontSize: "0.78rem", fontWeight: 900, color: "#17112a" }}>40</span>
        <span style={{ fontSize: "0.82rem", fontWeight: 900, color: "#7c3aed" }}>PKR 1,42,700</span>
      </div>
    </div>
  );
}

function PDFExportPanel() {
  return (
    <div className={styles.messagesPanel} style={{ background: "#fff", border: "1px solid #ede9fe", borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 12, borderBottom: "2px solid #7c3aed" }}>
        <div>
          <div style={{ fontSize: "0.68rem", fontWeight: 900, color: "#746b83" }}>REVENUE REPORT</div>
          <div style={{ fontSize: "0.9rem", fontWeight: 900, color: "#17112a" }}>Glow Studio</div>
          <div style={{ fontSize: "0.68rem", color: "#746b83" }}>1 May to 31 May 2026</div>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#db2777)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 900, color: "#fff" }}>GS</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[
          { label: "Total Revenue", value: "PKR 4,86,000", color: "#7c3aed" },
          { label: "Appointments",  value: "142",           color: "#0284c7" },
          { label: "Avg Ticket",    value: "PKR 3,422",     color: "#059669" },
          { label: "Est. Tips",     value: "PKR 38,880",    color: "#d97706" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "8px 10px", borderRadius: 8, background: "#f8f7ff" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 900, color: "#746b83" }}>{s.label}</div>
            <div style={{ fontSize: "0.85rem", fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "10px 12px", borderRadius: 10, background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
        <Download size={14} color="#fff" />
        <span style={{ fontSize: "0.78rem", fontWeight: 900, color: "#fff" }}>Export full report as PDF</span>
      </div>
    </div>
  );
}

/* ─── feature rows ───────────────────────────────────────── */
const rows = [
  {
    eyebrow: "Period comparison",
    title: "Accounting software in Pakistan for salon revenue reports",
    body: "Switch between 7 days, 14 days, 1 month, or 1 year. Every metric, including total revenue, appointment count, and average ticket, shows its percentage change against the equivalent previous period, giving beauty salons and hair salons a simple accounting dashboard without spreadsheets.",
    visual: <PeriodComparisonPanel />,
  },
  {
    eyebrow: "Revenue trend chart",
    title: "See revenue as a bar chart across days or months",
    body: "The trend chart shows daily bars for 7-day, 14-day, and 30-day views. Switch to 1-year view and bars represent monthly totals. Click any monthly bar to drill down into that month's daily breakdown instantly.",
    visual: <BarChartPanel />,
  },
  {
    eyebrow: "Payment method breakdown",
    title: "Salon cash flow management by payment method",
    body: "Every paid invoice's payment method is tracked and aggregated. Cash, JazzCash, EasyPaisa, Raast, Card, and Bank Transfer: each with a percentage of total revenue and a proportional bar, useful for salon accounting software in Lahore and across Pakistan.",
    visual: <PaymentBreakdownPanel />,
  },
  {
    eyebrow: "Top services",
    title: "See which services generate the most revenue",
    body: "Salon Central ranks your top 6 services by total revenue earned in the selected period. Each shows the number of times performed and the total PKR generated, so you always know your highest-value offerings.",
    visual: <TopServicesPanel />,
  },
  {
    eyebrow: "Daily breakdown table",
    title: "Daily revenue, expenses, invoices, and average ticket in one table",
    body: "The daily table lists each day with appointment count, total revenue, and average ticket. Combined with expense tracking and invoice records, Salon Central works as low-cost accounting software for Pakistani salons that need clear cash-flow reporting.",
    visual: <DailyTablePanel />,
  },
  {
    eyebrow: "PDF export",
    title: "Export a complete revenue report with one click",
    body: "Hit Export PDF and Salon Central generates a branded A4 report with stats, trend chart, payment method breakdown, top services, and the full daily table, all formatted for print or email. Monthly drill-down views export their own detailed report.",
    visual: <PDFExportPanel />,
  },
];

const faqs = [
  {
    q: "What is salon revenue management software?",
    a: "Salon revenue management software helps beauty salons, hair salons, and spas track daily income, monitor business performance, analyze sales, and generate financial reports. Salon Central combines revenue tracking, invoicing, payment reporting, and analytics to help salon owners make smarter business decisions.",
  },
  {
    q: "How does Salon Central's revenue management software work?",
    a: "Salon Central's revenue management software automatically records every transaction processed through your salon. It generates real-time revenue reports, tracks daily sales, analyzes payment methods, highlights top-performing services, and provides business insights, all from one easy-to-use dashboard.",
  },
  {
    q: "Can I track my salon's daily and monthly revenue?",
    a: "Yes. Salon Central lets you monitor daily, weekly, monthly, and yearly revenue from one dashboard. You can compare business performance over different time periods, identify growth trends, and make data-driven decisions to improve your salon's profitability.",
  },
  {
    q: "Can I see which services generate the most revenue?",
    a: "Absolutely. Our salon revenue management software provides detailed reports showing your highest-performing services, top-selling retail products, and overall sales trends. This helps you understand which services contribute the most to your salon's revenue.",
  },
  {
    q: "Does Salon Central track different payment methods?",
    a: "Yes. Salon Central tracks payments made through cash, cards, JazzCash, EasyPaisa, Raast, bank transfers, and other payment methods. You can view payment method breakdowns in your revenue reports for accurate financial tracking.",
  },
  {
    q: "Can I export revenue and financial reports?",
    a: "Yes. Salon Central allows you to generate and export detailed revenue reports with a single click. These reports help salon owners monitor business performance, review financial data, and simplify record keeping.",
  },
  {
    q: "Is Salon Central an accounting software in Pakistan?",
    a: "Salon Central includes accounting features specifically designed for beauty salons, hair salons, and spas. If you're looking for accounting software in Pakistan that combines invoicing, revenue tracking, POS, inventory, payroll, and financial reporting, Salon Central provides everything in one platform.",
  },
  {
    q: "Is Salon Central suitable for salon owners in Lahore and across Pakistan?",
    a: "Yes. Whether you're searching for accounting software in Lahore or managing salons anywhere in Pakistan, Salon Central helps you track revenue, manage finances, generate reports, and monitor business performance from one cloud-based system.",
  },
  {
    q: "How does Salon Central help increase salon profitability?",
    a: "By providing real-time revenue insights, payment reports, top service analytics, inventory tracking, and financial reporting, Salon Central's salon revenue management software helps salon owners identify growth opportunities, reduce losses, and improve overall business performance.",
  },
  {
    q: "Why choose Salon Central for revenue management and accounting in Pakistan?",
    a: "Salon Central is an all-in-one salon management platform that combines salon revenue management software, POS, appointment scheduling, client management, inventory, invoicing, payroll, loyalty programs, and WhatsApp automation. If you're looking for the best accounting software in Pakistan for beauty salons and hair salons, Salon Central gives you all the tools needed to manage and grow your business from a single dashboard.",
  },
];

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      style={{ maxWidth: 860, margin: "0 auto", padding: "84px 5%" }}
      aria-label="Revenue management FAQs"
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          FAQs
        </span>
        <h2 style={{ marginTop: 8 }}>Salon Revenue Management Software: Frequently Asked Questions</h2>
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
    { "@type": "ListItem", position: 3, name: "Revenue Management", item: `${siteConfig.url}/features/revenue-management` },
  ],
};

export default function RevenueFeaturePage() {
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
                <TrendingUp size={16} />
                Accounting software in Pakistan
              </div>
              <h1>Revenue management software for salons in Pakistan</h1>
              <p>
                Salon Central gives beauty salons and hair salons a live revenue dashboard with invoices, expenses, cash-flow reports, payment method breakdowns, top service rankings, and one-click PDF export. Built for salon owners in Lahore and across Pakistan who want the best accounting software for daily business control.
              </p>
              <div className={styles.heroActions}>
                <button type="button" onClick={() => setDemoOpen(true)} className={styles.primaryCta}>
                  Get started <ArrowRight size={17} />
                </button>
                <Link href="/pricing" className={styles.secondaryCta}>
                  View pricing
                </Link>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.imageChip}>
                <Image src="/salon-central-logo.png" alt="Salon Central logo" width={96} height={96} />
                <span>Salon Central Revenue</span>
              </div>
              <HeroRevenue />
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
            <span>Salon accounting software for Lahore and Pakistan</span>
            <h2>Know your revenue, expenses, and cash flow without opening a spreadsheet</h2>
          </div>
          <div className={styles.ctaActions}>
            <button type="button" onClick={() => setDemoOpen(true)} className={styles.primaryCta}>
              Get started <ArrowRight size={17} />
            </button>
            <Link href="/pricing" className={styles.secondaryDark}>View pricing</Link>
          </div>
        </section>

        {/* ── mini stats ── */}
        <section className={styles.miniStats} aria-label="Revenue management advantages">
          <div>
            <CalendarDays size={19} />
            <strong>Business reports</strong>
            <span>7-day, 14-day, monthly, and yearly views for salon revenue reporting.</span>
          </div>
          <div>
            <BarChart2 size={19} />
            <strong>Drill-down charts</strong>
            <span>Click any monthly bar to expand into a full daily breakdown for that month.</span>
          </div>
          <div>
            <Scissors size={19} />
            <strong>Top services</strong>
            <span>Top 6 services ranked by revenue: know your highest-value offerings instantly.</span>
          </div>
          <div>
            <Download size={19} />
            <strong>Accounting reports</strong>
            <span>Full branded report with revenue, payment methods, invoices, and daily table.</span>
          </div>
        </section>

        <FaqSection />
      </main>
      <Footer />
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
