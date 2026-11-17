"use client";
import { useState } from "react";
import styles from "../app/contact/contact.module.css";

const TOPICS = ["Pricing", "Book a demo", "Support", "Something else"];

// No backend: the form builds a WhatsApp message so every enquiry lands in the sales inbox.
export default function ContactForm() {
  const [f, setF] = useState({ name: "", phone: "", business: "", topic: TOPICS[0], message: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = [
      `Hi, I'm ${f.name}${f.business ? ` from ${f.business}` : ""}.`,
      `Topic: ${f.topic}`,
      f.message,
      `My number: ${f.phone}`,
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/923029646928?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label>Your name<input required value={f.name} onChange={set("name")} autoComplete="name" /></label>
      <label>Phone / WhatsApp<input required type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" /></label>
      <label>Salon or clinic name<input value={f.business} onChange={set("business")} /></label>
      <label>What is this about?
        <select value={f.topic} onChange={set("topic")}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select>
      </label>
      <label>Message<textarea rows={4} value={f.message} onChange={set("message")} placeholder="Tell us what you need" /></label>
      <button type="submit">Send on WhatsApp</button>
      <p className={styles.note}>This opens WhatsApp with your message ready to send.</p>
    </form>
  );
}
