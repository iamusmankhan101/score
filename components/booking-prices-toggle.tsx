"use client";

import { useEffect, useState } from "react";
import { SETTINGS_CHANGED_EVENT, saveSettings, settingsStore } from "@/lib/settings-store";

// Read fresh each time: reloadSettings() (sidebar on navigation, dashboard after a sync) swaps in a
// new appearance object, so a reference kept from render would save the old value.
const appearance = () => settingsStore.appearance as { hideBookingPrices?: boolean };

/** Hide prices on the online booking page (and the WordPress plugin, which embeds it). Saves on toggle. */
export default function BookingPricesToggle() {
  const [hidden, setHidden] = useState(appearance().hideBookingPrices === true);
  const [status, setStatus] = useState<"" | "saved" | "error">("");

  useEffect(() => {
    const sync = () => setHidden(appearance().hideBookingPrices === true);
    window.addEventListener(SETTINGS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, sync);
  }, []);

  async function toggle() {
    const next = !hidden;
    setHidden(next);
    setStatus("");
    appearance().hideBookingPrices = next;
    const ok = await saveSettings();
    if (!ok) {
      // Didn't reach the database, so customers would still see the old setting — undo and say so.
      appearance().hideBookingPrices = !next;
      setHidden(!next);
      void saveSettings();
    }
    setStatus(ok ? "saved" : "error");
  }

  return (
    <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #eeeaf6", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <div>
        <div style={{ color: "#29263d", fontSize: 12, fontWeight: 800 }}>Hide prices on booking page</div>
        <div style={{ fontSize: 11, color: "#9995ad", marginTop: 3, lineHeight: 1.5 }}>
          Customers see services, durations and times but no prices or totals. Bookings still record the amount for you.
          Also applies to the booking form on your website (WordPress plugin).
        </div>
        {status && (
          <div style={{ fontSize: 11, marginTop: 4, color: status === "saved" ? "#059669" : "#dc2626" }}>
            {status === "saved" ? (hidden ? "Prices are now hidden." : "Prices are now shown.") : "Couldn't save — check your connection and try again."}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => void toggle()}
        aria-pressed={hidden}
        aria-label="Hide prices on booking page"
        style={{ width: 44, height: 24, flexShrink: 0, border: "none", borderRadius: 999, background: hidden ? "var(--accent)" : "#dedeea", position: "relative", cursor: "pointer" }}
      >
        <span style={{ position: "absolute", top: 3, left: hidden ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.15s" }} />
      </button>
    </div>
  );
}
