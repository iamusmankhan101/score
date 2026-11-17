"use client";
import { useEffect, useState } from "react";
import { initializePaddle, type Paddle, type Environments, type CountryCode } from "@paddle/paddle-js";
import styles from "./Pricing.module.css";
import { Check } from "lucide-react";

const CONTACT_SALES_URL = "https://wa.me/+923029646928?text=Hi%2C%20I%27m%20interested%20in%20a%20Salon%20Central%20plan.";

const plans: Array<{
  badge: string;
  badgeStyle: Record<string, string>;
  name: string;
  desc: string;
  price: string;
  period: string;
  features: (string | { label: string; soon: boolean })[];
  cta: string;
  ctaHref: string;
  ctaClass: string;
  featured: boolean;
}> = [
  {
    badge: "No WhatsApp",
    badgeStyle: { background: "#cffafe", color: "#0e7490" },
    name: "Starter",
    desc: "Core salon management without WhatsApp automation.",
    price: "Contact Sales",
    period: "",
    features: [
      "Point of Sale (POS)",
      "Unlimited appointment booking",
      "Branded online web booking page",
      "Unlimited staff & client management",
      "Inventory management",
      "Invoicing",
      "Revenue management",
      "Services management",
    ],
    cta: "Contact Sales",
    ctaHref: CONTACT_SALES_URL,
    ctaClass: "btn btn-outline",
    featured: false,
  },
  {
    badge: "Most Popular",
    badgeStyle: {},
    name: "Pro",
    desc: "The complete toolkit for growing salons.",
    price: "Contact Sales",
    period: "",
    features: [
      "Point of Sale (POS)",
      "Unlimited appointment booking",
      "Branded online web booking page",
      "Unlimited staff & client management",
      "Inventory management",
      "Invoicing",
      "Revenue management",
      "Services management",
      "whatsapp reminders",
    ],
    cta: "Contact Sales",
    ctaHref: CONTACT_SALES_URL,
    ctaClass: "btn btn-primary",
    featured: true,
  },
  {
    badge: "Premium",
    badgeStyle: { background: "#fef3c7", color: "#d97706" },
    name: "Premium",
    desc: "Everything in Pro plus virtual try-on and multi-location branch management.",
    price: "Contact Sales",
    period: "",
    features: [
      "Point of Sale (POS)",
      "Unlimited appointment booking",
      "Branded online web booking page",
      "Unlimited staff & client management",
      "Inventory management",
      "Invoicing",
      "Revenue management",
      "Services management",
      "whatsapp reminders",
      "virtual try on",
      "multi-location branch management",
    ],
    cta: "Contact Sales",
    ctaHref: CONTACT_SALES_URL,
    ctaClass: "btn btn-outline",
    featured: false,
  },
];

// Live Paddle price IDs (USD base price; Paddle converts to the visitor's local currency).
const PRICE_IDS: Record<string, { month: string; year: string }> = {
  starter: { month: "pri_01m7nntbj8da1rtj081e2zwr7e", year: "pri_01m7nntbwyc2hy6fsnrwtz00sj" },
  pro:     { month: "pri_01m7nntch1zcw6faepzyaeqajx", year: "pri_01m7nntcs6890kg16b6n10fve8" },
  premium: { month: "pri_01m7nntdbkmp3c0s4rybkbpen5", year: "pri_01m7nntdkzyxtyqgrprf94kqx7" },
};

type Preview = Record<string, { total: number; currency: string; formatted: string }>;

// Fetches localized prices from Paddle for every plan/cycle once per country.
function usePaddlePrices(enabled: boolean, country: string) {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const environment = process.env.NEXT_PUBLIC_PADDLE_ENV as Environments | undefined;
    if (!token || !environment) { setFailed(true); return; }
    let dead = false;
    initializePaddle({ token, environment })
      .then(async (p) => {
        if (!p) throw new Error("Paddle init failed");
        const items = Object.values(PRICE_IDS).flatMap((x) => [x.month, x.year]).map((priceId) => ({ priceId, quantity: 1 }));
        const res = await p.PricePreview({ items, ...(country && { address: { countryCode: country as CountryCode } }) });
        if (dead) return;
        const m: Preview = {};
        for (const li of res.data.details.lineItems) {
          m[li.price.id] = { total: Number(li.totals.total), currency: res.data.currencyCode, formatted: li.formattedTotals.total };
        }
        setPaddle(p);
        setPreview(m);
      })
      .catch(() => { if (!dead) setFailed(true); });
    return () => { dead = true; };
  }, [enabled, country]);
  return { paddle, preview, failed };
}

// Paddle amounts are in the lowest currency unit; Intl knows how many decimals each currency has.
const money = (minor: number, currency: string) => {
  const f = new Intl.NumberFormat("en", { style: "currency", currency });
  return f.format(minor / 10 ** f.resolvedOptions().maximumFractionDigits!);
};

type Props = {
  prices?: Record<string, number | null>; // fixed local prices (Pakistan); missing/null = Contact Sales
  symbol?: string;
  annual?: boolean;                        // show the discounted per-month price, billed yearly
  discount?: number;                       // e.g. 0.2 = 20% off when annual (fixed local prices only)
  showHeader?: boolean;
  paddleCountry?: string;                  // set (even "") to use live Paddle prices + checkout instead of `prices`
};

export default function Pricing({ prices, symbol = "", annual = false, discount = 0.2, showHeader = true, paddleCountry }: Props) {
  const usePaddle = paddleCountry !== undefined;
  const { paddle, preview, failed } = usePaddlePrices(usePaddle, paddleCountry ?? "");
  const fmt = (n: number) => `${symbol}${n.toLocaleString("en-US")}`;
  return (
    <section className={styles.section} id="pricing">
      {showHeader && <div className="text-center">
        <div className="section-label" data-animate data-delay="0">✦ Pricing</div>
        <h2 className="section-title" data-animate data-delay="0.1">Plans Built Around<br />Your Salon.</h2>
        <p className="section-sub" data-animate data-delay="0.2">Talk to our sales team and choose the setup that fits your salon.</p>
      </div>}
      <div className={styles.grid}>
        {plans.map((p, i) => {
          const key = p.name.toLowerCase();
          let priceNode: React.ReactNode;
          let cta: React.ReactNode;
          const contact = <a href={p.ctaHref} target="_blank" rel="noopener noreferrer" className={`${p.ctaClass} ${styles.planBtn}`}>{p.cta}</a>;
          const contactPrice = <span className={`${styles.amount} ${styles.contactPrice}`}>Contact Sales</span>;

          if (usePaddle) {
            const priceId = PRICE_IDS[key][annual ? "year" : "month"];
            const item = preview?.[priceId];
            if (failed) { priceNode = contactPrice; cta = contact; }
            else if (!item) { priceNode = <span className={styles.amount}>…</span>; cta = <span className={`${p.ctaClass} ${styles.planBtn}`}>Loading…</span>; }
            else {
              priceNode = (
                <div>
                  <span className={styles.amount}>{annual ? money(item.total / 12, item.currency) : item.formatted}</span>
                  <span className={styles.period}> /month</span>
                  {annual && <div className={styles.billed}>Billed {item.formatted} yearly</div>}
                </div>
              );
              cta = <button type="button" className={`${p.ctaClass} ${styles.planBtn}`} onClick={() => paddle?.Checkout.open({ items: [{ priceId, quantity: 1 }], settings: { variant: "one-page", successUrl: "https://app.saloncentral.xyz/sign-up?paid=1" } })}>Get Started</button>;
            }
          } else {
            const base = prices?.[key];
            const amount = base == null ? null : annual ? Math.round(base * (1 - discount)) : base;
            priceNode = amount == null ? contactPrice : (
              <div>
                <span className={styles.amount}>{fmt(amount)}</span>
                <span className={styles.period}> /month</span>
                {annual && <div className={styles.billed}>Billed {fmt(amount * 12)} yearly</div>}
              </div>
            );
            cta = <a href={p.ctaHref} target="_blank" rel="noopener noreferrer" className={`${p.ctaClass} ${styles.planBtn}`}>{amount == null ? p.cta : "Get Started"}</a>;
          }

          return (
          <div key={p.name} data-animate data-delay={`${0.25 + i * 0.12}`} className={`${styles.card} ${p.featured ? styles.featured : ""}`}>
            <div className={styles.badge} style={p.badgeStyle}>{p.badge}</div>
            <div className={styles.planName}>{p.name}</div>
            <p className={styles.planDesc}>{p.desc}</p>
            <div className={styles.price}>{priceNode}</div>
            <ul className={styles.features}>
              {p.features.map((f) => {
                const label = typeof f === "string" ? f : f.label;
                const soon  = typeof f === "object" && f.soon;
                return (
                  <li key={label}>
                    <span className={styles.checkIcon}><Check size={10} strokeWidth={3} /></span>
                    <span>{label}</span>
                    {soon && <span className={styles.soonBadge}>Coming Soon</span>}
                  </li>
                );
              })}
            </ul>
            {cta}
          </div>
          );
        })}
      </div>
    </section>
  );
}
