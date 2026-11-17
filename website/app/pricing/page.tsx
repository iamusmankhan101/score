import Link from "next/link";
import { Check } from "lucide-react";
import { headers } from "next/headers";
import Navbar from "../../components/Navbar";
import Pricing from "../../components/Pricing";
import Footer from "../../components/Footer";
import styles from "./pricing.module.css";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Salon Central Pricing",
  description: "Simple monthly plans for salons and clinics. Starter, Pro and Premium, priced for your country.",
  path: "/pricing",
});

// ── EDIT PAKISTAN PRICES HERE ───────────────────────────────────────────────
// Pakistan keeps fixed ₨ prices and the WhatsApp sales route. Every other country pays through
// Paddle: the USD base price (set in the Paddle dashboard) is converted to local currency.
type PlanKey = "starter" | "pro" | "premium";
const PK_PRICES: Record<PlanKey, number> = { starter: 3999, pro: 9499, premium: 12499 };
const ANNUAL_DISCOUNT = 0.2; // annual billing = 20% off the monthly price (matches the yearly prices in Paddle)
// ─────────────────────────────────────────────────────────────────────────────

const PLANS: { key: PlanKey; name: string }[] = [
  { key: "starter", name: "Starter" },
  { key: "pro", name: "Pro" },
  { key: "premium", name: "Premium" },
];

// Each row: feature name, then [starter, pro, premium]. true = included, false = not.
const rows: [string, boolean, boolean, boolean][] = [
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

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ c?: string; b?: string }> }) {
  const { c, b } = await searchParams;
  const annual = b !== "monthly"; // annual is the default tab
  // Visitor's country comes from Vercel's geo header. ?c=GB etc. is only a manual override for testing.
  const country = (c || (await headers()).get("x-vercel-ip-country") || "").toUpperCase();
  const isPK = country === "PK";
  const pkPrice = (k: PlanKey) => `₨${(annual ? Math.round(PK_PRICES[k] * (1 - ANNUAL_DISCOUNT)) : PK_PRICES[k]).toLocaleString("en-US")}/month`;

  return (
    <>
      <Navbar forceSolid />
      <main className={styles.page}>
        <section className={styles.hero}>
          <h1>Plans for every salon</h1>
          <p>Simple pricing, shown in your local currency. Pick the plan that fits your salon or clinic.</p>
          <div className={styles.switch} role="group" aria-label="Billing period">
            <Link href={`/pricing?${c ? `c=${c}&` : ""}b=monthly`} scroll={false} className={!annual ? styles.active : ""}>Monthly</Link>
            <Link href={`/pricing?${c ? `c=${c}&` : ""}b=annual`} scroll={false} className={annual ? styles.active : ""}>Annual · save 20%</Link>
          </div>
        </section>

        {isPK
          ? <Pricing symbol="₨" prices={PK_PRICES} annual={annual} discount={ANNUAL_DISCOUNT} showHeader={false} />
          : <Pricing paddleCountry={country} annual={annual} showHeader={false} />}

        <section className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th></th>{PLANS.map((p) => <th key={p.key}>{p.name}</th>)}</tr>
            </thead>
            <tbody>
              {isPK && (
                <tr>
                  <td>Price</td>
                  {PLANS.map((p) => <td key={p.key}>{pkPrice(p.key)}</td>)}
                </tr>
              )}
              {rows.map(([name, ...vals]) => (
                <tr key={name}>
                  <td>{name}</td>
                  {vals.map((v, i) => (
                    <td key={i}>{v ? <Check size={16} strokeWidth={3} className={styles.tick} aria-label="Included" /> : <span aria-label="Not included">–</span>}</td>
                  ))}
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
