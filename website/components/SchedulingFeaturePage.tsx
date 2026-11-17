"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  Globe,
  UserCog,
  CalendarX2,
  ChevronDown,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import DemoModal from "./DemoModal";
import styles from "./SchedulingFeaturePage.module.css";
import { siteConfig } from "@/lib/seo";

const scheduleBlocks = [
  {
    time: "10:00",
    client: "Sana Nawaz",
    service: "Hair Color",
    stylist: "Zara",
    className: "lilac",
  },
  {
    time: "11:30",
    client: "Fatima Ali",
    service: "Hydra Facial",
    stylist: "Nida",
    className: "mint",
  },
  {
    time: "02:00",
    client: "Maria Khan",
    service: "Bridal Trial",
    stylist: "Ayesha",
    className: "peach",
  },
  {
    time: "04:30",
    client: "Aena Malik",
    service: "Nails",
    stylist: "Sara",
    className: "cyan",
  },
];

function StaffSchedulePanel() {
  const staff = [
    { name: "Zara K.",  color: "#7c3aed", appts: ["10:00 · Hair Color", "12:30 · Keratin"] },
    { name: "Nida M.",  color: "#059669", appts: ["11:00 · Hydra Facial", "2:30 · Cleanup"] },
    { name: "Sara A.",  color: "#db2777", appts: ["10:30 · Nails", "3:00 · Bridal Trial"] },
  ];
  return (
    <div className={styles.staffPanel}>
      <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#17112a", marginBottom: 10 }}>Today&apos;s Staff Schedule</div>
      {staff.map((s) => (
        <div key={s.name} className={styles.staffRow}>
          <div className={styles.avatarSmall} style={{ background: s.color + "22", color: s.color }}>{s.name.charAt(0)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{s.name}</strong>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 3 }}>
              {s.appts.map((a) => (
                <span key={a} style={{ fontSize: "0.65rem", color: "#9898b0" }}>{a}</span>
              ))}
            </div>
          </div>
          <em style={{ fontSize: "0.7rem", color: s.color, fontStyle: "normal", fontWeight: 700 }}>{s.appts.length} appts</em>
        </div>
      ))}
    </div>
  );
}

function CancellationPanel() {
  const items = [
    { name: "Sana N.",   service: "Hair Color",   date: "28 May", status: "Cancelled", sc: "#dc2626", sbg: "#fef2f2" },
    { name: "Fatima A.", service: "Hydra Facial",  date: "29 May", status: "No Show",   sc: "#d97706", sbg: "#fffbeb" },
    { name: "Maria K.",  service: "Keratin",       date: "30 May", status: "Cancelled", sc: "#dc2626", sbg: "#fef2f2" },
  ];
  return (
    <div className={styles.staffPanel}>
      <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#17112a", marginBottom: 10 }}>Cancellations &amp; No Shows</div>
      {items.map((it) => (
        <div key={it.name} className={styles.staffRow}>
          <div className={styles.avatarSmall}>{it.name.charAt(0)}</div>
          <div style={{ flex: 1 }}>
            <strong>{it.name}</strong>
            <span>{it.service} · {it.date}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, color: it.sc, background: it.sbg, padding: "2px 7px", borderRadius: 20 }}>{it.status}</span>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#7c3aed", cursor: "pointer" }}>Reschedule →</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const rows = [
  {
    eyebrow: "Online booking",
    title: "Let clients book from your branded booking page, 24/7",
    body:
      "Salon Central's online salon software gives clients a branded booking page to pick their service, choose a stylist, and confirm a time, without calling the salon. As salon booking software built for Pakistan, bookings land directly in your dashboard with source, services, and total already filled in, and business hours and closed days are respected automatically.",
    visual: <PhoneBookingPanel />,
  },
  {
    eyebrow: "Staff scheduling",
    title: "Schedule every stylist's day without conflicts or guesswork",
    body:
      "Salon Central's salon scheduling software assigns appointments to specific staff members and shows each stylist's workload side by side on the weekly calendar. It's true beauty salon scheduling software, with stylist and service pre-linked on every new booking. No double-bookings: Salon Central shows only the available slots for each team member.",
    visual: <StaffSchedulePanel />,
  },
  {
    eyebrow: "Automatic reminders",
    title: "Send confirmations, reminders, and follow-ups automatically",
    body:
      "As beauty salon appointment software, Salon Central sends a booking confirmation the moment an appointment is created, a 24-hour reminder the day before, a 2-hour reminder on the day, and a post-visit follow-up. All via WhatsApp, with zero manual effort from your team.",
    visual: <MessagesPanel />,
  },
  {
    eyebrow: "Cancellation management",
    title: "Handle cancellations and no-shows without losing track",
    body:
      "Salon Central is the best salon booking software and hair salon booking software for beauty salons across Pakistan. Mark appointments as cancelled or no-show in one tap, and cancelled slots free up immediately for new bookings. Both statuses are tracked in client history and daily reports so you can see your no-show rate and follow up with a reschedule message.",
    visual: <CancellationPanel />,
  },
];

const faqs = [
  {
    q: "What is salon appointment scheduling software?",
    a: "Salon appointment scheduling software helps beauty salons, hair salons, spas, and barber shops manage appointments from one platform. Salon Central's salon appointment software allows you to schedule bookings, manage walk-ins, organize staff calendars, reduce no-shows, and accept online bookings, making it one of the best salon booking software solutions for growing salons.",
  },
  {
    q: "How does Salon Central's appointment scheduling software work?",
    a: "Salon Central's salon appointment scheduling software provides an interactive calendar where you can create, edit, reschedule, or cancel appointments in seconds. Every booking is linked to a client profile, assigned staff member, selected service, and payment status. Whether you run a beauty salon, hair salon, or spa, our salon scheduling software keeps your daily operations organized.",
  },
  {
    q: "Can clients book appointments online?",
    a: "Yes. Salon Central's online salon booking software allows clients to book appointments 24/7 through your branded booking page. Customers can choose their preferred service, staff member, date, and time, and appointments are instantly added to your salon calendar. This makes Salon Central an excellent online salon software for beauty salons and hair salons.",
  },
  {
    q: "Does the software prevent double bookings?",
    a: "Yes. Our salon scheduling software automatically checks staff availability before confirming appointments. This prevents double bookings, scheduling conflicts, and overlapping appointments, helping beauty salons, hair salons, and spas deliver a smooth customer experience.",
  },
  {
    q: "Can I reschedule or cancel appointments easily?",
    a: "Absolutely. Salon Central's salon appointment software lets you reschedule, cancel, or update appointments with just a few clicks. Changes are reflected instantly across your calendar, helping you manage both advance bookings and walk-in clients without confusion.",
  },
  {
    q: "Does Salon Central send automated WhatsApp appointment reminders?",
    a: "Yes. Our salon appointment scheduling software automatically sends WhatsApp booking confirmations, appointment reminders, and follow-up messages. These automated reminders help reduce missed appointments, improve client communication, and increase repeat visits for beauty salons, hair salons, and spas.",
  },
  {
    q: "Can I assign appointments to specific staff members?",
    a: "Yes. Salon Central's salon booking software lets you assign appointments to individual stylists, beauticians, therapists, or barbers. Each staff member has their own schedule, making it easy to manage availability, workloads, and service assignments from a single dashboard.",
  },
  {
    q: "Can I manage multiple staff schedules from one calendar?",
    a: "Yes. Salon Central's appointment scheduling software includes a centralized calendar where you can view and manage schedules for your entire team. This feature is ideal for salons with multiple employees and supports employee shift scheduling for hair salons and spas, helping you optimize staff availability.",
  },
  {
    q: "Can I manage walk-in and advance appointments in one system?",
    a: "Yes. Salon Central's salon management software allows you to manage walk-in customers, phone bookings, and online appointments from one calendar. Whether you're running a beauty salon, hair salon, nail salon, spa, bridal salon, or barber shop, every booking is tracked in one place for better efficiency.",
  },
  {
    q: "Why choose Salon Central as your salon appointment scheduling software in Pakistan?",
    a: "Salon Central is built specifically for beauty salons, hair salons, spas, nail salons, bridal salons, and barber shops in Pakistan. Our salon appointment scheduling software includes online booking, salon POS, client management, inventory management, invoicing, payroll, revenue reporting, loyalty programs, and WhatsApp automation in one cloud-based platform. If you're looking for the best salon booking software, best appointment scheduling software for salons, or a complete online salon software solution in Pakistan, Salon Central helps you streamline operations and grow your business.",
  },
];

function HeroCalendar() {
  return (
    <div className={styles.heroCard} aria-label="Salon Central scheduling preview">
      <div className={styles.heroCardTop}>
        <div>
          <span>Calendar</span>
          <strong>May 2026</strong>
        </div>
        <button type="button">New booking</button>
      </div>
      <div className={styles.heroWeek}>
        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, index) => (
          <div key={day} className={index === 2 ? styles.activeDay : ""}>
            <span>{day}</span>
            <strong>{25 + index}</strong>
          </div>
        ))}
      </div>
      <div className={styles.heroSchedule}>
        {scheduleBlocks.map((block) => (
          <div key={`${block.time}-${block.client}`} className={`${styles.heroAppt} ${styles[block.className]}`}>
            <span>{block.time}</span>
            <strong>{block.client}</strong>
            <small>
              {block.service} with {block.stylist}
            </small>
          </div>
        ))}
      </div>
      <div className={styles.floatingNote}>
        <CheckCircle2 size={16} />
        <span>WhatsApp reminder queued</span>
      </div>
    </div>
  );
}


function MessagesPanel() {
  return (
    <div className={styles.messagesPanel}>
      <div className={styles.messageHeader}>
        <MessageCircle size={18} />
        <span>Glow Studio</span>
      </div>
      <div className={styles.chatBubble}>
        Booking confirmed: Hair Color with Zara, Wed 28 May at 2:00 PM.
      </div>
      <div className={styles.chatBubble}>
        Reminder: your appointment is tomorrow at 2:00 PM. See you soon.
      </div>
      <div className={styles.chatBubbleMuted}>Follow-up scheduled after visit</div>
    </div>
  );
}

function PhoneBookingPanel() {
  return (
      <div className={styles.phoneWrap}>
      <div className={styles.phone}>
        <div className={styles.phoneTop}>Salon Central Booking</div>
        <div className={styles.phoneField}>Sana Nawaz - 0300 1234567</div>
        <div className={styles.phoneField}>Hair Color</div>
        <div className={styles.phoneFieldActive}>Open 09:00 - 20:00</div>
        <div className={styles.phoneButton}>Confirm Booking</div>
      </div>
      <div className={styles.shareCard}>
        <Sparkles size={16} />
        <span>Web bookings are saved with source, services, total duration, and price.</span>
      </div>
    </div>
  );
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      style={{ maxWidth: 860, margin: "0 auto", padding: "84px 5%" }}
      aria-label="Appointment scheduling FAQs"
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          FAQs
        </span>
        <h2 style={{ marginTop: 8 }}>Salon Appointment Scheduling Software: Frequently Asked Questions</h2>
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

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
    { "@type": "ListItem", position: 2, name: "Features", item: `${siteConfig.url}/#features` },
    { "@type": "ListItem", position: 3, name: "Appointment Scheduling", item: `${siteConfig.url}/features/appointment-scheduling` },
  ],
};

export default function SchedulingFeaturePage() {
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
                <CalendarDays size={16} />
                Appointment scheduling and calendar
              </div>
              <h1>Take control of your salon schedule</h1>
              <p>
                Salon Central is salon appointment software Pakistan salons trust. Manage bookings, client details, stylist assignments, WhatsApp reminders, online booking, and checkout handoff, all in one dashboard built for the beauty industry.
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
                <span>Salon Central OS</span>
              </div>
              <HeroCalendar />
            </div>
          </div>
          <div className={styles.wave} aria-hidden="true" />
        </section>

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

        <section className={styles.ctaBand}>
          <div>
            <span>Ready to simplify operations?</span>
            <h2>Find out if Salon Central is right for your salon</h2>
          </div>
          <div className={styles.ctaActions}>
            <button type="button" onClick={() => setDemoOpen(true)} className={styles.primaryCta}>
              Get started <ArrowRight size={17} />
            </button>
            <Link href="/pricing" className={styles.secondaryDark}>View pricing</Link>
          </div>
        </section>

        <section className={styles.miniStats} aria-label="Scheduling advantages">
          <div>
            <Globe size={19} />
            <strong>Online booking</strong>
            <span>Branded booking page shared via Instagram, Google Maps, or your website.</span>
          </div>
          <div>
            <UserCog size={19} />
            <strong>Staff scheduling</strong>
            <span>Per-stylist calendars with no double-bookings and conflict detection.</span>
          </div>
          <div>
            <Bell size={19} />
            <strong>Automatic reminders</strong>
            <span>WhatsApp confirmations, 24hr &amp; 2hr reminders, and post-visit follow-ups.</span>
          </div>
          <div>
            <CalendarX2 size={19} />
            <strong>Cancellation management</strong>
            <span>One-tap cancel or no-show, tracked in history with reschedule prompts.</span>
          </div>
        </section>

        <FaqSection />
      </main>
      <Footer />
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
