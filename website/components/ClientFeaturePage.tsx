"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Users, Search, Tag,
  AlertTriangle, Heart, Globe, Camera, Download, ChevronDown,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import DemoModal from "./DemoModal";
import styles from "./SchedulingFeaturePage.module.css";
import { siteConfig } from "@/lib/seo";

/* ─── hero client card ───────────────────────────────────── */
function HeroClient() {
  return (
    <div className={styles.heroCard} aria-label="Salon Central client management preview">
      <div className={styles.heroCardTop}>
        <div>
          <span>Clients</span>
          <strong>Sana Nawaz</strong>
        </div>
        <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 900, background: "#ede9fe", color: "#7c3aed" }}>VIP</span>
      </div>

      {/* stat grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { label: "Visits", value: "24", color: "#7c3aed" },
          { label: "Spend",  value: "₨1.86L", color: "#059669" },
          { label: "Avg",    value: "₨7,750", color: "#0284c7" },
          { label: "Next",   value: "1",      color: "#d97706" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "8px 6px", borderRadius: 10, background: "#f8f7ff", textAlign: "center" }}>
            <div style={{ fontSize: "0.88rem", fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#9ca3af" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* beauty profile */}
      <div style={{ padding: "12px 14px", borderRadius: 12, background: "#f5f3ff", border: "1px solid #ede9fe", marginBottom: 10 }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 900, color: "#7c3aed", marginBottom: 8 }}>BEAUTY PROFILE</div>
        {[
          { label: "Hair Formula",  value: "Loreal 7.3 + 20vol · 35min", c: "#7c3aed" },
          { label: "Skin Type",     value: "Oily Combination" },
          { label: "Allergy",       value: "⚠ PPD Dye",                  c: "#dc2626" },
        ].map((r) => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", padding: "4px 0", borderBottom: "1px solid #ede9fe" }}>
            <span style={{ color: "#9ca3af", fontWeight: 700 }}>{r.label}</span>
            <span style={{ fontWeight: 900, color: (r as { c?: string }).c || "#17112a" }}>{r.value}</span>
          </div>
        ))}
      </div>

      {/* recent visit */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", borderRadius: 10, background: "#f0fdf4" }}>
        <div style={{ fontSize: "0.75rem" }}>
          <div style={{ fontWeight: 800, color: "#17112a" }}>Hair Color · Zara K.</div>
          <div style={{ color: "#9ca3af" }}>28 May 2026</div>
        </div>
        <span style={{ fontWeight: 900, color: "#059669", fontSize: "0.82rem" }}>PKR 4,500</span>
      </div>

      <div className={styles.floatingNote} style={{ right: -20, top: 200 }}>
        <Heart size={14} />
        <span>24 visits · VIP</span>
      </div>
    </div>
  );
}

/* ─── feature visuals ────────────────────────────────────── */
function SearchFilterPanel() {
  const clients = [
    { name: "Sana Nawaz",  tag: "VIP",     tagC: "#7c3aed", tagBg: "#ede9fe", spend: "PKR 1,86,000", visits: 24, src: "WhatsApp" },
    { name: "Fatima Ali",  tag: "Bridal",  tagC: "#db2777", tagBg: "#fdf2f8", spend: "PKR 98,000",   visits: 8,  src: "Web" },
    { name: "Maria Khan",  tag: "Regular", tagC: "#059669", tagBg: "#ecfdf5", spend: "PKR 54,200",   visits: 16, src: "Walk-in" },
    { name: "Aena Malik",  tag: "New",     tagC: "#0369a1", tagBg: "#e0f2fe", spend: "PKR 4,500",    visits: 1,  src: "Web" },
  ];
  return (
    <div className={styles.staffPanel}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, background: "#f5f3ff", border: "1px solid #ede9fe", marginBottom: 12, fontSize: "0.75rem", color: "#746b83" }}>
        <Search size={12} /> Search by name, phone, or email…
      </div>
      {clients.map((c) => (
        <div key={c.name} className={styles.staffRow}>
          <div className={styles.avatarSmall} style={{ background: "#7c3aed22", color: "#7c3aed", fontSize: "0.65rem", fontWeight: 900 }}>
            {c.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <strong style={{ fontSize: "0.84rem", color: "#17112a" }}>{c.name}</strong>
              <span style={{ padding: "1px 7px", borderRadius: 999, fontSize: "0.62rem", fontWeight: 900, background: c.tagBg, color: c.tagC }}>{c.tag}</span>
            </div>
            <span style={{ fontSize: "0.68rem", color: "#9ca3af" }}>{c.src} · {c.visits} visits</span>
          </div>
          <strong style={{ fontSize: "0.78rem", color: "#7c3aed", fontWeight: 900 }}>{c.spend}</strong>
        </div>
      ))}
    </div>
  );
}

function BeautyProfilePanel() {
  return (
    <div className={styles.checkoutPanel}>
      <div style={{ fontSize: "0.78rem", fontWeight: 900, color: "#7c3aed", marginBottom: 12 }}>Sana Nawaz&apos;s Beauty Profile</div>
      {[
        { label: "Skin Type",        value: "Oily Combination",           c: "#0284c7" },
        { label: "Nail Preference",  value: "Gel, medium length, nudes"  },
      ].map((r) => (
        <div key={r.label} className={styles.checkoutBody}>
          <div>
            <span>{r.label}</span>
            <strong style={{ color: (r as { c?: string }).c || "#17112a" }}>{r.value}</strong>
          </div>
        </div>
      ))}
      {/* allergy alert */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca" }}>
        <AlertTriangle size={15} color="#dc2626" />
        <div>
          <div style={{ fontSize: "0.76rem", fontWeight: 900, color: "#dc2626" }}>Allergy Alert</div>
          <div style={{ fontSize: "0.7rem", color: "#991b1b" }}>PPD Dye: do not use</div>
        </div>
      </div>
      {/* hair formula */}
      <div style={{ padding: "10px 12px", borderRadius: 10, background: "#f5f3ff", border: "1px solid #ede9fe" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 900, color: "#7c3aed", marginBottom: 6 }}>HAIR FORMULA</div>
        {[
          { label: "Brand / Shade",  value: "Loreal Professional 7.3" },
          { label: "Developer",      value: "20 vol" },
          { label: "Ratio",          value: "1:1.5" },
          { label: "Process time",   value: "35 minutes" },
        ].map((r) => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", padding: "3px 0" }}>
            <span style={{ color: "#9ca3af" }}>{r.label}</span>
            <strong style={{ color: "#17112a" }}>{r.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function TagsSourcePanel() {
  const tags = [
    { label: "VIP",     c: "#7c3aed", bg: "#ede9fe", n: 12 },
    { label: "Regular", c: "#059669", bg: "#ecfdf5", n: 34 },
    { label: "Bridal",  c: "#db2777", bg: "#fdf2f8", n: 7 },
    { label: "New",     c: "#0369a1", bg: "#e0f2fe", n: 18 },
    { label: "At-Risk", c: "#dc2626", bg: "#fef2f2", n: 5 },
  ];
  const sources = [
    { label: "WhatsApp", c: "#059669", bg: "#dcfce7", n: 28 },
    { label: "Walk-in",  c: "#d97706", bg: "#fef3c7", n: 31 },
    { label: "Web",      c: "#0284c7", bg: "#dbeafe", n: 16 },
    { label: "Manual",   c: "#6b7280", bg: "#f3f4f6", n: 5 },
  ];
  return (
    <div className={styles.staffPanel}>
      <div style={{ fontSize: "0.72rem", fontWeight: 900, color: "#746b83", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Client tags</div>
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 16 }}>
        {tags.map((t) => (
          <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: t.bg }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 900, color: t.c }}>{t.label}</span>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: t.c, opacity: 0.7 }}>{t.n}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: "0.72rem", fontWeight: 900, color: "#746b83", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Booking source</div>
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
        {sources.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: s.bg }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 900, color: s.c }}>{s.label}</span>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: s.c, opacity: 0.7 }}>{s.n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisitHistoryPanel() {
  const visits = [
    { service: "Hair Color",        staff: "Zara K.",   date: "28 May", amt: "PKR 4,500",  photos: 2 },
    { service: "Keratin Treatment", staff: "Zara K.",   date: "14 Apr", amt: "PKR 6,000",  photos: 2 },
    { service: "Hydra Facial",      staff: "Nida M.",   date: "2 Mar",  amt: "PKR 3,200",  photos: 0 },
    { service: "Bridal Trial",      staff: "Ayesha M.", date: "18 Feb", amt: "PKR 12,000", photos: 4 },
  ];
  return (
    <div className={styles.staffPanel}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 900, color: "#17112a" }}>Visit history</span>
        <span style={{ fontSize: "0.7rem", fontWeight: 900, color: "#7c3aed" }}>24 total visits</span>
      </div>
      {visits.map((v) => (
        <div key={`${v.service}-${v.date}`} className={styles.staffRow}>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: "0.84rem", color: "#17112a" }}>{v.service}</strong>
            <span style={{ fontSize: "0.68rem" }}>{v.staff} · {v.date}</span>
          </div>
          {v.photos > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 20, background: "#ede9fe", marginRight: 8, cursor: "pointer" }}>
              <Camera size={10} color="#7c3aed" />
              <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#7c3aed" }}>{v.photos}</span>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 20, background: "#f3f4f6", marginRight: 8, cursor: "pointer" }}>
              <Camera size={10} color="#9ca3af" />
              <span style={{ fontSize: "0.6rem", fontWeight: 600, color: "#9ca3af" }}>Add</span>
            </div>
          )}
          <em style={{ color: "#059669", fontStyle: "normal", fontWeight: 900, fontSize: "0.78rem" }}>{v.amt}</em>
        </div>
      ))}
    </div>
  );
}

function LifetimeValuePanel() {
  return (
    <div className={styles.checkoutPanel}>
      <div className={styles.clientStrip}>
        <div className={styles.avatar}>SN</div>
        <div>
          <strong style={{ color: "#17112a", fontSize: "0.92rem" }}>Sana Nawaz</strong>
          <span>VIP · Since Jan 2024</span>
        </div>
      </div>
      {[
        { label: "Total visits",    value: "24" },
        { label: "Total spend",     value: "PKR 1,86,000", purple: true },
        { label: "Avg ticket",      value: "PKR 7,750" },
        { label: "Last visit",      value: "28 May 2026" },
        { label: "Preferred staff", value: "Zara Khan" },
        { label: "Source",          value: "WhatsApp" },
      ].map((row) => (
        <div key={row.label} className={styles.checkoutBody}>
          <div>
            <span>{row.label}</span>
            <strong style={{ color: (row as { purple?: boolean }).purple ? "#7c3aed" : "#17112a" }}>{row.value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

function NotesPreferencesPanel() {
  return (
    <div className={styles.checkoutPanel}>
      <div style={{ fontSize: "0.78rem", fontWeight: 900, color: "#17112a", marginBottom: 12 }}>
        Sana Nawaz&apos;s Notes &amp; Preferences
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: "0.62rem", fontWeight: 900, color: "#7c3aed", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>Staff Notes</div>
        <div style={{ background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 8, padding: "9px 10px", fontSize: "0.72rem", color: "#374151", lineHeight: 1.55 }}>
          Prefers Zara for all colour services. Sensitive scalp: use cool water during rinse. Always offer green tea on arrival.
        </div>
      </div>
      <div style={{ fontSize: "0.62rem", fontWeight: 900, color: "#7c3aed", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>Preferences</div>
      {[
        { label: "Preferred stylist", value: "Zara Khan" },
        { label: "Appointment time",  value: "Weekday mornings" },
        { label: "Contact via",       value: "WhatsApp" },
        { label: "Fragrance",         value: "No strong fragrances" },
      ].map((r) => (
        <div key={r.label} className={styles.checkoutBody}>
          <div>
            <span>{r.label}</span>
            <strong style={{ color: "#17112a" }}>{r.value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

function BeforeAfterPanel() {
  const visits = [
    { label: "Hair Color",        date: "28 May", active: true,  photos: 2 },
    { label: "Keratin Treatment", date: "14 Apr", active: false, photos: 2 },
    { label: "Bridal Trial",      date: "18 Feb", active: false, photos: 4 },
  ];
  return (
    <div className={styles.staffPanel}>
      {/* visit selector */}
      <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" as const }}>
        {visits.map((v) => (
          <div key={v.label} style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 9px", borderRadius: 20, cursor: "pointer",
            background: v.active ? "#7c3aed" : "#f3f4f6",
            border: `1px solid ${v.active ? "#7c3aed" : "#e5e7eb"}`,
          }}>
            <Camera size={9} color={v.active ? "#fff" : "#9ca3af"} />
            <span style={{ fontSize: "0.6rem", fontWeight: 700, color: v.active ? "#fff" : "#6b7280" }}>
              {v.label} · {v.date}
            </span>
            <span style={{ fontSize: "0.55rem", fontWeight: 700, color: v.active ? "#c4b5fd" : "#9ca3af" }}>
              {v.photos}
            </span>
          </div>
        ))}
      </div>
      {/* active visit label */}
      <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#7c3aed", marginBottom: 6 }}>
        Hair Color · 28 May 2026 · Zara K.
      </div>
      {/* before / after photos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <div style={{ borderRadius: 10, overflow: "hidden", position: "relative" }}>
          <div style={{ height: 80, background: "linear-gradient(135deg, #e5e7eb, #d1d5db)" }} />
          <span style={{ position: "absolute", bottom: 5, left: 6, fontSize: "0.6rem", fontWeight: 800, color: "#374151", background: "rgba(255,255,255,0.9)", padding: "2px 7px", borderRadius: 20 }}>Before</span>
        </div>
        <div style={{ borderRadius: 10, overflow: "hidden", position: "relative" }}>
          <div style={{ height: 80, background: "linear-gradient(135deg, #ede9fe, #c4b5fd)" }} />
          <span style={{ position: "absolute", bottom: 5, left: 6, fontSize: "0.6rem", fontWeight: 800, color: "#7c3aed", background: "rgba(255,255,255,0.9)", padding: "2px 7px", borderRadius: 20 }}>After</span>
        </div>
      </div>
      {/* upload prompt */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px", borderRadius: 8, background: "#f5f3ff", border: "1px dashed #a78bfa", cursor: "pointer" }}>
        <Camera size={12} color="#7c3aed" />
        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#7c3aed" }}>Upload photos for this visit</span>
      </div>
    </div>
  );
}

function ExportPanel() {
  return (
    <div className={styles.checkoutPanel}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 900, color: "#17112a" }}>Client Report</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "#7c3aed", cursor: "pointer" }}>
          <Download size={12} color="#fff" />
          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#fff" }}>Export PDF</span>
        </div>
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ background: "#7c3aed", padding: "10px 14px" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#fff" }}>Sana Nawaz&apos;s Client Report</div>
          <div style={{ fontSize: "0.6rem", color: "#c4b5fd" }}>Generated 18 Jun 2026</div>
        </div>
        <div style={{ padding: "10px 14px" }}>
          {[
            { label: "Total visits",          value: "24" },
            { label: "Lifetime spend",         value: "PKR 1,86,000" },
            { label: "Services used",          value: "Hair, Facial, Nails" },
            { label: "Before/after photos",    value: "8 photos" },
            { label: "Allergy alerts",         value: "PPD Dye" },
          ].map((r) => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", padding: "4px 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ color: "#9ca3af" }}>{r.label}</span>
              <strong style={{ color: "#17112a" }}>{r.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── feature rows ───────────────────────────────────────── */
const rows = [
  {
    eyebrow: "Client profiles",
    title: "Every client's full profile in one place",
    body: "As client relationship management software, Salon Central gives each client a profile with name, phone, email, date of birth, preferred stylist, and source. Visit count, total spend, average ticket, and last visit date calculate automatically from their appointment history: no manual entry required.",
    visual: <LifetimeValuePanel />,
  },
  {
    eyebrow: "Search and filter",
    title: "Find any client in seconds by name, phone, or email",
    body: "This client management system software lets you type any part of a client's name, phone number, or email, and the list filters in real time. Narrow further by tag (VIP, Bridal, New, At-Risk) or booking source (WhatsApp, walk-in, web, manual) to find exactly who you need.",
    visual: <SearchFilterPanel />,
  },
  {
    eyebrow: "Beauty profiles",
    title: "Store hair formulas, skin type, allergies, and nail preferences",
    body: "Attach a beauty profile to any client. Record their exact hair colour formula (brand, shade, developer, ratio, processing time), skin type, nail preferences, and any allergies. Allergy alerts show in red so staff never miss them.",
    visual: <BeautyProfilePanel />,
  },
  {
    eyebrow: "Notes & preferences",
    title: "Keep private notes and service preferences for every client",
    body: "Salon Central is client management software CRM at its core: add free-text staff notes to any client profile, record sensitivities, personal preferences, special instructions, and anything your team needs before the appointment. Notes are visible at booking and checkout so nothing gets missed across shift changes.",
    visual: <NotesPreferencesPanel />,
  },
  {
    eyebrow: "Tags and sources",
    title: "Segment clients by value, status, and how they found you",
    body: "As salon CRM software, Salon Central lets you tag every client as VIP, Regular, Bridal, New, or At-Risk. Track their booking source as WhatsApp, walk-in, web, or manual. Filter the full client list by any combination of tag and source to spot patterns and prioritise outreach.",
    visual: <TagsSourcePanel />,
  },
  {
    eyebrow: "Visit history",
    title: "See every past appointment, service, stylist, and amount",
    body: "This beauty salon CRM software shows the last 8 completed appointments for each client: service name, attending stylist, date, and amount paid. Upcoming appointments are listed separately so your front desk sees the full picture before a client arrives.",
    visual: <VisitHistoryPanel />,
  },
  {
    eyebrow: "Before & after photos",
    title: "Attach before & after photos to every single visit",
    body: "Each visit in a client's history has its own before & after photo slot. Upload photos from any device during or after the appointment. They are saved against that specific visit, service, and stylist. Switch between visits to compare results over time, and use them for consultations, portfolio building, or WhatsApp promotions.",
    visual: <BeforeAfterPanel />,
  },
  {
    eyebrow: "PDF export",
    title: "Export any client's full profile as a polished PDF report",
    body: "As salon customer management software and salon invoice and customer management software in one, Salon Central generates a one-click PDF report for any client, including visit history, lifetime spend, beauty profile, allergy alerts, service breakdown, and before/after photo count. Share it with the client, use it for VIP outreach, or keep it for your records.",
    visual: <ExportPanel />,
  },
];

const faqs = [
  {
    q: "What is client management software?",
    a: "Client management software helps beauty salons, hair salons, spas, and barber shops organize customer information, appointment history, invoices, loyalty points, and communication in one place. Salon Central's salon client management software makes it easy to manage every client relationship while improving customer service and retention.",
  },
  {
    q: "How does Salon Central's client management system work?",
    a: "Salon Central's client management system software automatically creates a profile for every client. It stores contact details, visit history, services, invoices, notes, loyalty points, and preferences, making it a complete client management software CRM solution for modern salons.",
  },
  {
    q: "What information can I store for each client?",
    a: "With Salon Central's client database management software, you can store customer contact details, appointment history, purchased services, retail products, invoices, loyalty points, notes, allergies, preferences, and lifetime spending. This helps salons deliver more personalized customer experiences.",
  },
  {
    q: "Does Salon Central include a salon CRM?",
    a: "Yes. Salon Central's salon CRM software helps you build stronger customer relationships by managing client profiles, appointment history, invoices, loyalty rewards, and personalized notes. It is also an ideal beauty salon CRM software for beauty salons, hair salons, and spas.",
  },
  {
    q: "Can I track customer invoices and payment history?",
    a: "Absolutely. Salon Central's salon invoice and customer management software links every invoice and payment directly to the client's profile. This allows you to view complete billing history, outstanding balances, and previous purchases from one dashboard.",
  },
  {
    q: "Can I easily search and manage my clients?",
    a: "Yes. Our client contact management software lets you quickly search clients by name, phone number, or email. You can update customer information, view visit history, manage appointments, and communicate with clients from a single platform.",
  },
  {
    q: "Is Salon Central suitable for small salons?",
    a: "Yes. Salon Central's client management software for small business is designed for salons of every size. Whether you run a single beauty salon or multiple locations, our online client management software helps you organize customer information and grow your business more efficiently.",
  },
  {
    q: "Can I manage the complete client lifecycle?",
    a: "Yes. Salon Central's client lifecycle management software helps you manage every stage of the customer journey, from the first appointment to repeat visits, loyalty rewards, follow-ups, and long-term customer retention. Our client lifecycle management system software gives you a complete view of every client relationship.",
  },
  {
    q: "Why is Salon Central better than free or open-source client management software?",
    a: "Unlike free client management software for small business or open source client management software, Salon Central combines client management software, salon CRM software, appointment scheduling, POS, invoicing, inventory management, payroll, loyalty programs, and WhatsApp automation in one secure cloud platform built specifically for salons.",
  },
  {
    q: "Why choose Salon Central as your client management software?",
    a: "Salon Central is one of the best client management software solutions for beauty salons, hair salons, spas, and barber shops. Our salon client management software combines client relationship management software, client account management software, client resource management software, and powerful salon management software features to help you manage clients, improve customer relationships, increase repeat visits, and grow your salon business from one easy-to-use platform.",
  },
];

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      style={{ maxWidth: 860, margin: "0 auto", padding: "84px 5%" }}
      aria-label="Client management FAQs"
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          FAQs
        </span>
        <h2 style={{ marginTop: 8 }}>Client Management Software: Frequently Asked Questions</h2>
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
    { "@type": "ListItem", position: 3, name: "Client Management", item: `${siteConfig.url}/features/client-management` },
  ],
};

export default function ClientFeaturePage() {
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
                <Users size={16} />
                Client management
              </div>
              <h1>Know every client before they walk through the door</h1>
              <p>
                Salon Central is client management software built for salons: visit history, lifetime spend, hair formulas, allergy alerts, skin type, and tags, so your team delivers a personalised experience every single time.
                It&apos;s the best client management software for beauty salons that want it all in one place.
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
                <span>Salon Central Clients</span>
              </div>
              <HeroClient />
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
            <span>Free plan includes up to 5 clients</span>
            <h2>Build client relationships that bring people back</h2>
          </div>
          <div className={styles.ctaActions}>
            <button type="button" onClick={() => setDemoOpen(true)} className={styles.primaryCta}>
              Get started <ArrowRight size={17} />
            </button>
            <Link href="/pricing" className={styles.secondaryDark}>View pricing</Link>
          </div>
        </section>

        <section className={styles.miniStats} aria-label="Client management advantages">
          <div>
            <Heart size={19} />
            <strong>Beauty profiles</strong>
            <span>Hair formulas, skin type, allergies, and nail preferences per client.</span>
          </div>
          <div>
            <AlertTriangle size={19} />
            <strong>Allergy alerts</strong>
            <span>Red warning shown to staff any time a client with allergies is booked.</span>
          </div>
          <div>
            <Search size={19} />
            <strong>Notes &amp; preferences</strong>
            <span>Free-text staff notes and service preferences visible at booking and checkout.</span>
          </div>
          <div>
            <Camera size={19} />
            <strong>Before &amp; after photos</strong>
            <span>Photos linked to each visit, service, and stylist for easy reference.</span>
          </div>
          <div>
            <Tag size={19} />
            <strong>5 client tags</strong>
            <span>VIP, Regular, Bridal, New, At-Risk: filter and segment your whole list.</span>
          </div>
          <div>
            <Globe size={19} />
            <strong>Source tracking</strong>
            <span>Know if each client came via WhatsApp, walk-in, web booking, or manual entry.</span>
          </div>
          <div>
            <Download size={19} />
            <strong>PDF export</strong>
            <span>One-click client report with visit history, spend, photos, and allergy alerts.</span>
          </div>
        </section>

        <FaqSection />
      </main>
      <Footer />
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
