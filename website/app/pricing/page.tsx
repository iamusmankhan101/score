import Link from "next/link";
import { headers } from "next/headers";
import { Check } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import styles from "./pricing.module.css";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Salon Central Pricing",
  description: "Simple monthly plans for salons and clinics. Starter, Pro and Premium, priced for your country.",
  path: "/pricing",
});

const WHATSAPP = "https://wa.me/923029646928?text=Hi%2C%20I%27m%20interested%20in%20a%20Salon%20Central%20plan.";

// ── EDIT PRICES HERE ─────────────────────────────────────────────────────────
// Monthly price per plan, per region. Leave a price as null to show "Contact Sales".
// Add a region = add a row here + its country codes in COUNTRY_REGION below.
type PlanKey = "starter" | "pro" | "premium";
const REGIONS: Record<string, { label: string; symbol: string; prices: Record<PlanKey, number | null> }> = {
  PK:    { label: "Pakistan", symbol: "₨",   prices: { starter: 3999, pro: 9499, premium: 12499 } },
  AE:    { label: "UAE",      symbol: "AED ", prices: { starter: 80, pro: 175, premium: 250 } },
  GB:    { label: "UK",       symbol: "£",   prices: { starter: 15, pro: 30, premium: 50 } },
  OTHER: { label: "Global",   symbol: "$",   prices: { starter: null, pro: null, premium: null } },
};
const ANNUAL_DISCOUNT = 0.2; // annual billing = 20% off the monthly price
const COUNTRY_REGION: Record<string, string> = { PK: "PK", AE: "AE", GB: "GB" }; // anything else → OTHER
// ─────────────────────────────────────────────────────────────────────────────

const plans: { key: PlanKey; name: string; desc: string; featured: boolean }[] = [
  { key: "starter", name: "Starter", desc: "Core salon management without WhatsApp automation.", featured: false },
  { key: "pro", name: "Pro", desc: "The complete toolkit for growing salons.", featured: true },
  { key: "premium", name: "Premium", desc: "Everything in Pro plus virtual try-on and multi-location branches.", featured: false },
];

// Each row: feature name, then [starter, pro, premium]. true = included, false = not, string = shown as text.
const rows: [string, boolean | string, boolean | string, boolean | string][] = [
  ["Point of Sale (POS)", true, true, true],
  ["Unlimited appointment booking", true, true, true],
  ["Branded online booking page", true, true, true],
  ["Unlimited staff & clients", true, true, true],
  ["Inventory management", true, true, true],
  ["Invoicing", true, true, true],
  ["Revenue management", true, true, true],
  ["Services management", true, true, true],
  ["WhatsApp reminders", false, true, true],
  ["Virtual try-on", false, false, true],
  ["Multi-location branches", false, false, true],
];

const cell = (v: boolean | string) =>
  v === true ? <Check size={16} strokeWidth={3} className={styles.tick} aria-label="Included" /> : v === false ? <span aria-label="Not included">–</span> : v;

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ c?: string; b?: string }> }) {
  const { c, b } = await searchParams;
  const annual = b !== "monthly"; // annual is the default tab
  // Visitor's country comes from Vercel's geo header. ?c=PK|AE|GB is only a manual override for testing.
  const country = (c || (await headers()).get("x-vercel-ip-country") || "").toUpperCase();
  const regionKey = c && REGIONS[c.toUpperCase()] ? c.toUpperCase() : COUNTRY_REGION[country] ?? "OTHER";
  const region = REGIONS[regionKey];

  const fmt = (n: number) => `${region.symbol}${n.toLocaleString("en-US")}`;
  // Per-month price for the selected billing tab; null = Contact Sales.
  const monthly = (k: PlanKey) => {
    const p = region.prices[k];
    return p == null ? null : annual ? Math.round(p * (1 - ANNUAL_DISCOUNT)) : p;
  };
  const price = (k: PlanKey) => {
    const p = monthly(k);
    return p == null ? <span className={styles.contact}>Contact Sales</span> : (
      <>
        <span className={styles.amount}>{fmt(p)}</span>
        <span className={styles.period}> /month</span>
        {annual && <div className={styles.billed}>Billed {fmt(p * 12)} yearly</div>}
      </>
    );
  };

  return (
    <>
      <Navbar forceSolid />
      <main className={styles.page}>
        <section className={styles.hero}>
          <h1>Plans for every salon</h1>
          <p>Simple pricing, shown in your local currency. Pick the plan that fits your salon or clinic.</p>
          <div className={styles.switch} role="group" aria-label="Billing period">
            <Link href={`/pricing?c=${regionKey}&b=monthly`} scroll={false} className={!annual ? styles.active : ""}>Monthly</Link>
            <Link href={`/pricing?c=${regionKey}&b=annual`} scroll={false} className={annual ? styles.active : ""}>Annual · save 20%</Link>
          </div>
        </section>

        <section className={styles.cards}>
          {plans.map((p) => (
            <div key={p.key} className={`${styles.card} ${p.featured ? styles.featured : ""}`}>
              <h2>{p.name}</h2>
              <div className={styles.price}>{price(p.key)}</div>
              <p className={styles.desc}>{p.desc}</p>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className={styles.btn}>Get Started</a>
            </div>
          ))}
        </section>

        <section className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th></th>{plans.map((p) => <th key={p.key}>{p.name}</th>)}</tr>
            </thead>
            <tbody>
              <tr>
                <td>Price</td>
                {plans.map((p) => {
                  const v = monthly(p.key);
                  return <td key={p.key}>{v == null ? "Contact Sales" : `${fmt(v)}/month`}</td>;
                })}
              </tr>
              {rows.map(([name, ...vals]) => (
                <tr key={name}>
                  <td>{name}</td>
                  {vals.map((v, i) => <td key={i}>{cell(v)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
      <Footer />
    </>
  );
}
