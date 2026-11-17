"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Coins, Percent, CheckCircle2, History, Wallet, ChevronDown,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import DemoModal from "./DemoModal";
import styles from "./SchedulingFeaturePage.module.css";
import { siteConfig } from "@/lib/seo";

/* ─── hero payroll card ──────────────────────────────────── */
function HeroPayroll() {
  const payouts = [
    { name: "Ayesha Khan", role: "Senior Stylist", amount: "PKR 18,200", status: "Pending", c: "#d97706", bg: "#fffbeb" },
    { name: "Bilal Ahmed", role: "Barber",          amount: "PKR 9,600",  status: "Paid",    c: "#059669", bg: "#ecfdf5" },
  ];
  return (
    <div className={styles.heroCard} aria-label="Salon Central payroll preview">
      <div className={styles.heroCardTop}>
        <div>
          <span>Payroll</span>
          <strong>This Period</strong>
        </div>
        <button type="button">Process Payout</button>
      </div>
      {payouts.map((p) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: "#f8f7ff", border: "1px solid #ede9fe", marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#17112a" }}>{p.name}</div>
            <div style={{ fontSize: "0.68rem", color: "#9ca3af" }}>{p.role}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 900, color: "#17112a" }}>{p.amount}</div>
            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.6rem", fontWeight: 900, background: p.bg, color: p.c }}>{p.status}</span>
          </div>
        </div>
      ))}
      <div className={styles.floatingNote} style={{ right: -20, top: 180 }}>
        <Coins size={14} />
        <span>Auto-calculated from revenue</span>
      </div>
    </div>
  );
}

/* ─── feature visuals ────────────────────────────────────── */
function PayTypePanel() {
  return (
    <div className={styles.blockPanel}>
      <div className={styles.blockHeader} style={{ marginBottom: 14 }}>
        <Percent size={16} />
        <span style={{ fontWeight: 900, color: "#17112a" }}>Choose per staff member</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ padding: 14, borderRadius: 14, background: "#ea580c", border: "none" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 900, color: "rgba(255,255,255,.75)", marginBottom: 2 }}>COMMISSION</div>
          <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#fff" }}>30% of revenue generated</div>
        </div>
        <div style={{ padding: 14, borderRadius: 14, background: "#fff7ed", border: "1px solid #fed7aa" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 900, color: "#c2410c", marginBottom: 2 }}>FIXED SALARY</div>
          <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#17112a" }}>PKR 30,000 per period</div>
        </div>
      </div>
    </div>
  );
}

function CalculationPanel() {
  const rows = [
    { label: "Revenue Generated",  value: "PKR 60,700" },
    { label: "Commission (30%)",   value: "PKR 18,200", purple: true },
    { label: "Adjustment",         value: "+PKR 0" },
    { label: "Total Payout",       value: "PKR 18,200", purple: true },
  ];
  return (
    <div className={styles.checkoutPanel}>
      <div className={styles.clientStrip}>
        <div className={styles.avatar} style={{ background: "#ea580c22", color: "#ea580c", fontSize: "0.85rem" }}>AK</div>
        <div>
          <strong style={{ color: "#17112a", fontSize: "0.95rem" }}>Ayesha Khan</strong>
          <span>Senior Stylist · Commission 30%</span>
        </div>
      </div>
      {rows.map((row) => (
        <div key={row.label} className={styles.checkoutBody}>
          <div>
            <span>{row.label}</span>
            <strong style={{ color: (row as { purple?: boolean }).purple ? "#ea580c" : "#17112a" }}>{row.value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

function PayoutHistoryPanel() {
  const history = [
    { period: "Jun 1 to 30", amount: "PKR 17,400", status: "Paid" },
    { period: "May 1 to 31", amount: "PKR 15,900", status: "Paid" },
    { period: "Jul 1 to 2",  amount: "PKR 18,200", status: "Pending" },
  ];
  return (
    <div className={styles.staffPanel}>
      <div style={{ fontSize: "0.78rem", fontWeight: 900, color: "#17112a", marginBottom: 14 }}>Ayesha Khan&apos;s payout history</div>
      {history.map((h) => (
        <div key={h.period} className={styles.staffRow}>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: "0.84rem", color: "#17112a" }}>{h.period}</strong>
          </div>
          <span style={{
            padding: "2px 8px", borderRadius: 999, fontSize: "0.6rem", fontWeight: 900, marginRight: 8,
            background: h.status === "Paid" ? "#ecfdf5" : "#fffbeb",
            color: h.status === "Paid" ? "#059669" : "#d97706",
          }}>{h.status}</span>
          <em style={{ color: "#ea580c", fontStyle: "normal", fontWeight: 900, fontSize: "0.75rem" }}>{h.amount}</em>
        </div>
      ))}
    </div>
  );
}

function OneClickPanel() {
  return (
    <div className={styles.blockPanel}>
      <div className={styles.blockHeader} style={{ marginBottom: 14 }}>
        <CheckCircle2 size={16} />
        <span style={{ fontWeight: 900, color: "#17112a" }}>Mark as paid in one click</span>
      </div>
      <div className={styles.blockArea}>
        <div style={{ padding: 14, borderRadius: 14, background: "#fffbeb", border: "1px solid #fde68a" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 900, color: "#92400e", marginBottom: 2 }}>PENDING</div>
          <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#17112a" }}>PKR 18,200 due to Ayesha Khan</div>
        </div>
        <div style={{ padding: 12, borderRadius: 12, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: "0.74rem", fontWeight: 800, color: "#166534" }}>
          ✓ Pick a payment method and date. Status flips to Paid instantly
        </div>
      </div>
    </div>
  );
}

/* ─── feature rows ───────────────────────────────────────── */
const rows = [
  {
    eyebrow: "Flexible pay types",
    title: "Salon payroll software for commission or fixed salary",
    body: "Every team member can be paid a commission percentage of the revenue they generate, or a fixed salary per pay period. Set it once in Salon Central's HR and payroll software and every future payout follows it automatically.",
    visual: <PayTypePanel />,
  },
  {
    eyebrow: "Auto-calculated amounts",
    title: "Commission payroll software connected to real revenue",
    body: "Pick a pay period and Salon Central totals the completed appointment revenue for that stylist and applies their commission rate automatically. Add a manual bonus or deduction before you finalise the amount.",
    visual: <CalculationPanel />,
  },
  {
    eyebrow: "Payout history",
    title: "Employee payroll reports for every staff payout",
    body: "Every payout, commission or salary, is logged with its period, base amount, any adjustment, payment method, and paid date. Filter by pending or paid to see exactly who's owed what across your salon team.",
    visual: <PayoutHistoryPanel />,
  },
  {
    eyebrow: "One-click mark as paid",
    title: "Staff salary management software with pending payouts",
    body: "Process a payout as pending, then confirm the payment method and date once you actually pay your team. One click flips its status and keeps salary records and salon books accurate.",
    visual: <OneClickPanel />,
  },
];

const faqs = [
  {
    q: "What is salon payroll management software?",
    a: "Salon payroll management software helps beauty salons, hair salons, spas, and barber shops calculate salaries, commissions, bonuses, and staff payouts automatically. Salon Central's payroll management software reduces manual work while ensuring employees are paid accurately and on time.",
  },
  {
    q: "How does Salon Central's payroll software work?",
    a: "Salon Central's salon payroll software automatically calculates employee salaries based on fixed pay, commissions, services performed, product sales, incentives, and bonuses. Payroll data is linked with your salon POS, revenue, and staff performance for accurate salary calculations.",
  },
  {
    q: "Can I calculate staff commissions automatically?",
    a: "Yes. Salon Central's payroll management software automatically calculates commissions for stylists, beauticians, therapists, and barbers based on your commission rules. This eliminates manual calculations and reduces payroll errors.",
  },
  {
    q: "Can I manage salaries and payroll from one system?",
    a: "Absolutely. Salon Central lets you manage employee salaries, commissions, bonuses, deductions, payment history, and payroll reports from one dashboard. You can also mark salaries as paid and keep a complete payroll history for every employee.",
  },
  {
    q: "Does payroll integrate with invoicing and accounting?",
    a: "Yes. Salon Central connects payroll with salon invoicing software, salon billing software, salon accounting software, and revenue reports. Employee commissions and salaries are calculated using actual sales and invoices generated through the salon POS.",
  },
  {
    q: "Can I manage payroll for multiple employees?",
    a: "Yes. Whether you have two employees or a large salon team, Salon Central's payroll software lets you manage payroll for every staff member from one centralized dashboard. You can monitor salaries, commissions, attendance, and payment history in one place.",
  },
  {
    q: "Can I export payroll reports?",
    a: "Yes. Salon Central generates detailed payroll reports showing salaries, commissions, bonuses, deductions, and payment status. These reports help salon owners simplify payroll processing and financial record keeping.",
  },
  {
    q: "Is Salon Central suitable for beauty salons and hair salons?",
    a: "Yes. Salon Central is built specifically for beauty salons, hair salons, spas, nail salons, and barber shops. It combines payroll management with beauty salon accounting software, hair salon accounting software, invoice management software, and salon POS, making daily operations much easier.",
  },
  {
    q: "Does Salon Central work as salon accounting software?",
    a: "Yes. In addition to payroll, Salon Central includes accounting software for salons, salon accounting software, invoice software for salons, salon invoice software, and beauty salon invoicing software. This allows you to manage payroll, invoicing, revenue, expenses, and business reports from one platform.",
  },
  {
    q: "Why choose Salon Central for payroll management?",
    a: "Salon Central combines salon payroll management software, salon invoicing software, salon billing software, accounting software for salons, client management, salon POS, inventory management, appointment scheduling, loyalty programs, and WhatsApp automation in one cloud-based platform. Whether you run a beauty salon, hair salon, spa, or barber shop, Salon Central helps you automate payroll, reduce administrative work, and manage your entire business from a single dashboard.",
  },
];

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      style={{ maxWidth: 860, margin: "0 auto", padding: "84px 5%" }}
      aria-label="Payroll management FAQs"
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          FAQs
        </span>
        <h2 style={{ marginTop: 8 }}>Salon Payroll Management Software: Frequently Asked Questions</h2>
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
    { "@type": "ListItem", position: 3, name: "Payroll Management", item: `${siteConfig.url}/features/payroll-management` },
  ],
};

export default function PayrollFeaturePage() {
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
                <Coins size={16} />
                Payroll software in Pakistan
              </div>
              <h1>HR and payroll software for salon teams</h1>
              <p>
                Salon Central is payroll software in Pakistan for beauty salons and hair salons. Set each stylist up on commission or a fixed salary, calculate payouts from real revenue, and keep a full pending-to-paid history: no spreadsheets, no manual math.
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
                <span>Salon Central Payroll</span>
              </div>
              <HeroPayroll />
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
            <span>Commission, salary, and payout tracking included on every plan</span>
            <h2>Run salon payroll without spreadsheet work</h2>
          </div>
          <div className={styles.ctaActions}>
            <button type="button" onClick={() => setDemoOpen(true)} className={styles.primaryCta}>
              Get started <ArrowRight size={17} />
            </button>
            <Link href="/pricing" className={styles.secondaryDark}>View pricing</Link>
          </div>
        </section>

        <section className={styles.miniStats} aria-label="Payroll management advantages">
          <div>
            <Percent size={19} />
            <strong>HR and payroll software</strong>
            <span>Choose the pay type that fits each team member.</span>
          </div>
          <div>
            <Coins size={19} />
            <strong>Salary management</strong>
            <span>Commission is computed straight from completed revenue.</span>
          </div>
          <div>
            <History size={19} />
            <strong>Payroll reports</strong>
            <span>Every payout logged with period, amount, and status.</span>
          </div>
          <div>
            <Wallet size={19} />
            <strong>One-click paid</strong>
            <span>Confirm payment method and date, done instantly.</span>
          </div>
        </section>

        <FaqSection />
      </main>
      <Footer />
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
