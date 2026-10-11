"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { settingsStore } from "@/lib/settings-store";
import { Check } from "lucide-react";

export const inp: CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1px solid #e8e8f0", fontSize: 13, color: "#1a1a2e",
  outline: "none", background: "#fff",
};

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{label}</label>
      {hint && <div style={{ fontSize: 11, color: "#9898b0", marginBottom: 2 }}>{hint}</div>}
      {children}
    </div>
  );
}

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, background: value ? "#7C3AED" : "#e0e0ec", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
    </div>
  );
}

function SavedBanner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#ecfdf5", borderRadius: 8, fontSize: 13, color: "#059669", fontWeight: 500 }}>
      <Check size={14} /> Changes saved successfully.
    </div>
  );
}

function SaveBar({ onSave }: { onSave: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid #f0f0f8", marginTop: 8 }}>
      <button onClick={onSave} style={{ padding: "9px 24px", borderRadius: 9, border: "none", background: "#7C3AED", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
        Save Changes
      </button>
    </div>
  );
}

export function SalonProfile() {
  const [form, setForm] = useState({ ...settingsStore.salon });
  const [saved, setSaved] = useState(false);
  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));
  const save = () => { Object.assign(settingsStore.salon, form); setSaved(true); setTimeout(() => setSaved(false), 3000); };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {saved && <SavedBanner />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Salon Name"><input value={form.name} onChange={(e) => set("name", e.target.value)} style={inp} /></Field>
        <Field label="Phone"><input value={form.phone} onChange={(e) => set("phone", e.target.value)} style={inp} /></Field>
        <Field label="Email"><input value={form.email} onChange={(e) => set("email", e.target.value)} style={inp} /></Field>
        <Field label="City"><input value={form.city} onChange={(e) => set("city", e.target.value)} style={inp} /></Field>
      </div>
      <Field label="Address"><input value={form.address} onChange={(e) => set("address", e.target.value)} style={inp} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Currency">
          <select value={form.currency} onChange={(e) => set("currency", e.target.value)} style={inp}>
            <option value="PKR">PKR — Pakistani Rupee</option>
            <option value="USD">USD — US Dollar</option>
            <option value="AED">AED — UAE Dirham</option>
          </select>
        </Field>
        <Field label="Timezone">
          <select value={form.timezone} onChange={(e) => set("timezone", e.target.value)} style={inp}>
            <option value="Asia/Karachi">Asia/Karachi (PKT +5:00)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
            <option value="UTC">UTC</option>
          </select>
        </Field>
      </div>
      <SaveBar onSave={save} />
    </div>
  );
}

export function BusinessHours() {
  const [hours, setHours] = useState(() => (settingsStore.hours as any[]).map((h: any) => ({ ...h })));
  const [saved, setSaved] = useState(false);
  const toggle = (i: number) => setHours((h: any[]) => h.map((r: any, idx: number) => idx === i ? { ...r, open: !r.open } : r));
  const setTime = (i: number, k: "from" | "to", v: string) => setHours((h: any[]) => h.map((r: any, idx: number) => idx === i ? { ...r, [k]: v } : r));
  const save = () => { hours.forEach((h: any, i: number) => Object.assign(settingsStore.hours[i], h)); setSaved(true); setTimeout(() => setSaved(false), 3000); };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {saved && <SavedBanner />}
      {hours.map((row: any, i: number) => (
        <div key={row.day} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", background: "#f9f9fb", borderRadius: 10 }}>
          <div style={{ width: 100, fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{row.day}</div>
          <Toggle value={row.open} onChange={() => toggle(i)} />
          {row.open ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
              <input type="time" value={row.from} onChange={(e) => setTime(i, "from", e.target.value)} style={{ ...inp, width: 120 }} />
              <span style={{ fontSize: 12, color: "#9898b0" }}>to</span>
              <input type="time" value={row.to} onChange={(e) => setTime(i, "to", e.target.value)} style={{ ...inp, width: 120 }} />
            </div>
          ) : (
            <span style={{ fontSize: 12, color: "#b0b0c8", fontStyle: "italic" }}>Closed</span>
          )}
        </div>
      ))}
      <SaveBar onSave={save} />
    </div>
  );
}

export function Notifications() {
  const [prefs, setPrefs] = useState({ ...settingsStore.notifications });
  const [saved, setSaved] = useState(false);
  const toggle = (k: keyof typeof prefs) => setPrefs((p: any) => ({ ...p, [k]: !p[k] }));
  const save = () => { Object.assign(settingsStore.notifications, prefs); setSaved(true); setTimeout(() => setSaved(false), 3000); };
  const reminderHours = Number(settingsStore.wasender.reminderHours) || 24;
  const rows = [
    { section: "Appointments", items: [
      { key: "apptReminder", label: "Appointment reminders", hint: `Send reminder ${reminderHours}h before (change lead time in Account → WhatsApp)` },
      { key: "apptConfirm",  label: "Booking confirmations", hint: "Notify client on booking" },
      { key: "noShow",       label: "No-show alerts",        hint: "Alert staff on no-shows" },
    ]},
    { section: "Reports", items: [
      { key: "dailySummary",  label: "Daily summary",    hint: "End-of-day revenue report" },
      { key: "weeklySummary", label: "Weekly summary",   hint: "Every Monday morning" },
      { key: "lowStock",      label: "Low stock alerts", hint: "When items fall below minimum" },
    ]},
    { section: "Channels", items: [
      { key: "whatsappNotify", label: "WhatsApp notifications", hint: "Send via WhatsApp" },
      { key: "emailNotify",    label: "Email notifications",    hint: "Send via email" },
    ]},
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {saved && <SavedBanner />}
      {rows.map(({ section, items }) => (
        <div key={section}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#b0b0c8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{section}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {items.map(({ key, label, hint }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f9f9fb", borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a2e" }}>{label}</div>
                  <div style={{ fontSize: 11, color: "#9898b0", marginTop: 2 }}>{hint}</div>
                </div>
                <Toggle value={prefs[key as keyof typeof prefs]} onChange={() => toggle(key as keyof typeof prefs)} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <SaveBar onSave={save} />
    </div>
  );
}

export function Appearance() {
  const [form, setForm] = useState({ ...settingsStore.appearance });
  const [saved, setSaved] = useState(false);
  const colors = ["#7C3AED", "#db2777", "#0369a1", "#059669", "#d97706", "#dc2626"];
  const save = () => {
    // Only the fields this form edits, so a stale copy can't undo the booking-page price toggle.
    Object.assign(settingsStore.appearance, { accent: form.accent, dateFormat: form.dateFormat, timeFormat: form.timeFormat }); setSaved(true); setTimeout(() => setSaved(false), 3000); };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {saved && <SavedBanner />}
      <Field label="Accent Color" hint="Used for buttons, highlights, and active states.">
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          {colors.map((c) => (
            <div key={c} onClick={() => setForm((f: any) => ({ ...f, accent: c }))} style={{ width: 32, height: 32, borderRadius: "50%", background: c, cursor: "pointer", boxShadow: form.accent === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : "none", transition: "all 0.15s" }} />
          ))}
        </div>
      </Field>
      <Field label="Date Format">
        <select value={form.dateFormat} onChange={(e) => setForm((f: any) => ({ ...f, dateFormat: e.target.value }))} style={inp}>
          <option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option>
        </select>
      </Field>
      <Field label="Time Format">
        <select value={form.timeFormat} onChange={(e) => setForm((f: any) => ({ ...f, timeFormat: e.target.value }))} style={inp}>
          <option>12-hour (1:00pm)</option><option>24-hour (13:00)</option>
        </select>
      </Field>
      <SaveBar onSave={save} />
    </div>
  );
}

export function Security() {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [saved, setSaved] = useState(false);
  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));
  const canSave = form.current && form.newPass && form.newPass === form.confirm;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {saved && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#ecfdf5", borderRadius: 8, fontSize: 13, color: "#059669", fontWeight: 500 }}><Check size={14} /> Password updated successfully.</div>}
      <Field label="Current Password"><input type="password" value={form.current} onChange={(e) => set("current", e.target.value)} placeholder="••••••••" style={inp} /></Field>
      <Field label="New Password"><input type="password" value={form.newPass} onChange={(e) => set("newPass", e.target.value)} placeholder="••••••••" style={inp} /></Field>
      <Field label="Confirm New Password">
        <input type="password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)} placeholder="••••••••" style={{ ...inp, borderColor: form.confirm && form.confirm !== form.newPass ? "#dc2626" : "#e8e8f0" }} />
        {form.confirm && form.confirm !== form.newPass && <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4 }}>Passwords do not match.</div>}
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid #f0f0f8", marginTop: 8 }}>
        <button onClick={() => { if (canSave) { setSaved(true); setForm({ current: "", newPass: "", confirm: "" }); setTimeout(() => setSaved(false), 3000); } }}
          style={{ padding: "9px 24px", borderRadius: 9, border: "none", background: canSave ? "#7C3AED" : "#e8e8f0", fontSize: 13, fontWeight: 600, color: canSave ? "#fff" : "#b0b0c8", cursor: canSave ? "pointer" : "not-allowed" }}>
          Update Password
        </button>
      </div>
    </div>
  );
}

export function WhatsAppSection() {
  const [form, setForm] = useState({ ...settingsStore.whatsapp });
  const [saved, setSaved] = useState(false);
  const save = () => { Object.assign(settingsStore.whatsapp, form); setSaved(true); setTimeout(() => setSaved(false), 3000); };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {saved && <SavedBanner />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: form.connected ? "#ecfdf5" : "#fef2f2", borderRadius: 12, border: `1px solid ${form.connected ? "#bbf7d0" : "#fecaca"}` }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: form.connected ? "#059669" : "#dc2626" }}>{form.connected ? "WhatsApp Connected" : "WhatsApp Disconnected"}</div>
          <div style={{ fontSize: 12, color: "#9898b0", marginTop: 2 }}>{form.connected ? "+92 300-1234567 · Business API active" : "Connect your WhatsApp Business account"}</div>
        </div>
        <button onClick={() => setForm((f: any) => ({ ...f, connected: !f.connected }))} style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${form.connected ? "#dc2626" : "#059669"}`, background: "#fff", fontSize: 12, fontWeight: 600, color: form.connected ? "#dc2626" : "#059669", cursor: "pointer" }}>
          {form.connected ? "Disconnect" : "Connect"}
        </button>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#b0b0c8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Message Templates</div>
      {(["reminder", "confirmation", "followup"] as const).map((key) => (
        <Field key={key} label={key === "reminder" ? "Appointment Reminder" : key === "confirmation" ? "Booking Confirmation" : "Follow-up Message"} hint="Variables: {name} {service} {date} {time}">
          <textarea value={form[key]} onChange={(e) => setForm((f: any) => ({ ...f, [key]: e.target.value }))} rows={3} style={{ ...inp, resize: "none", lineHeight: 1.6 }} />
        </Field>
      ))}
      <SaveBar onSave={save} />
    </div>
  );
}

export function AIIntegrations() {
  const [form, setForm] = useState({ 
    huggingFaceToken: (settingsStore.replicate as any)?.apiToken || "",
  });
  const [saved, setSaved] = useState(false);
  const save = () => { 
    if (!settingsStore.replicate) {
      (settingsStore as any).replicate = {};
    }
    (settingsStore.replicate as any).apiToken = form.huggingFaceToken;
    setSaved(true); 
    setTimeout(() => setSaved(false), 3000); 
  };
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {saved && <SavedBanner />}
      
      <div style={{ padding: "14px 16px", background: "#faf8ff", borderRadius: 10, border: "1px solid #EDE9FE" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#7C3AED", marginBottom: 6 }}>✨ Virtual Try-On with Stable Diffusion</div>
        <div style={{ fontSize: 12, color: "#6b6b8a", lineHeight: 1.6 }}>
          The virtual try-on feature uses free Stable Diffusion AI. No API key required! 
          Optionally add a Hugging Face token below for faster processing and higher rate limits.
        </div>
      </div>

      <Field 
        label="Hugging Face Token (Optional)" 
        hint="Get a free token at huggingface.co/settings/tokens · Enables faster AI generation"
      >
        <input 
          type="password" 
          value={form.huggingFaceToken} 
          onChange={(e) => setForm((f) => ({ ...f, huggingFaceToken: e.target.value }))} 
          placeholder="hf_••••••••••••••••••••••••••••••••" 
          style={inp} 
        />
      </Field>

      <div style={{ padding: "12px 14px", background: "#f9f9fb", borderRadius: 8, fontSize: 11, color: "#6b6b8a", lineHeight: 1.6 }}>
        <strong style={{ color: "#1a1a2e" }}>How to get a token:</strong>
        <ol style={{ margin: "8px 0 0 0", paddingLeft: 20 }}>
          <li>Visit <a href="https://huggingface.co/join" target="_blank" rel="noopener noreferrer" style={{ color: "#7C3AED" }}>huggingface.co</a> and sign up (free)</li>
          <li>Go to Settings → Access Tokens</li>
          <li>Create a new token with "Read" permissions</li>
          <li>Copy and paste it above</li>
        </ol>
      </div>

      <SaveBar onSave={save} />
    </div>
  );
}
