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
  PK:    { label: "Pakistan", symbol: "₨",   prices: { starter: null, pro: null, premium: null } },
  AE:    { label: "UAE",      symbol: "AED ", prices: { starter: null, pro: null, premium: null } },
  OTHER: { label: "Global",   symbol: "$",   prices: { starter: null, pro: null, premium: null } },
};
const COUNTRY_REGION: Record<string, string> = { PK: "PK", AE: "AE" }; // anything else → OTHER
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

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  // Visitor's country: ?c= override (from the switcher) wins, else Vercel's geo header.
  const country = (c || (await headers()).get("x-vercel-ip-country") || "").toUpperCase();
  const regionKey = c && REGIONS[c.toUpperCase()] ? c.toUpperCase() : COUNTRY_REGION[country] ?? "OTHER";
  const region = REGIONS[regionKey];

  const price = (k: PlanKey) => {
    const p = region.prices[k];
    return p == null ? <span className={styles.contact}>Contact Sales</span> : (
      <>
        <span className={styles.amount}>{region.symbol}{p.toLocaleString("en-US")}</span>
        <span className={styles.period}> /month</span>
      </>
    );
  };

  return (
    <>
      <Navbar forceSolid />
      <main className={styles.page}>
        <section className={styles.hero}>
          <h1>Plans for every salon</h1>
          <p>Simple monthly pricing. Pick the plan that fits your salon or clinic.</p>
          <div className={styles.switch} role="group" aria-label="Choose your country">
            {Object.entries(REGIONS).map(([k, r]) => (
              <Link key={k} href={`/pricing?c=${k}`} scroll={false} className={k === regionKey ? styles.active : ""}>{r.label}</Link>
            ))}
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
                  const v = region.prices[p.key];
                  return <td key={p.key}>{v == null ? "Contact Sales" : `${region.symbol}${v.toLocaleString("en-US")}/month`}</td>;
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
