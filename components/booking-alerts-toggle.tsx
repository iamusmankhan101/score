"use client";

/**
 * "Booking alerts on this phone" — sidebar switch for staff phone notifications
 * (new online bookings). Phones and tablets only, and hidden where the browser
 * can't do push: on iPhone that means until the app is added to the Home Screen.
 */

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { checkPushSupport, getExistingSubscription, subscribeToPush, unsubscribeFromPush } from "@/lib/push-client";

/** Endpoint this device saved as a staff phone — the subscription itself can't say whose it is. */
export const STAFF_PUSH_KEY = "sc_staff_push_endpoint";

export default function BookingAlertsToggle() {
  const [state, setState] = useState<"hidden" | "off" | "on" | "busy">("hidden");
  const [error, setError] = useState("");

  useEffect(() => {
    // Phones and tablets only (touch, no mouse) — the alert is meant for the phone in a stylist's pocket.
    if (!window.matchMedia("(hover: none) and (pointer: coarse)").matches) return;
    if (!checkPushSupport().supported) return;
    getExistingSubscription().then((sub) => {
      let saved: string | null = null;
      try { saved = localStorage.getItem(STAFF_PUSH_KEY); } catch { /* storage blocked */ }
      setState(sub && sub.endpoint === saved ? "on" : "off");
    });
  }, []);

  async function turnOn() {
    setState("busy"); setError("");
    const res = await subscribeToPush({ staff: true });
    if (res.ok) {
      try { localStorage.setItem(STAFF_PUSH_KEY, res.endpoint); } catch { /* still on server-side */ }
      setState("on");
    } else {
      setError(res.permissionDenied ? "Notifications are blocked. Allow them for this site in your phone's settings." : res.error);
      setState("off");
    }
  }

  async function turnOff() {
    setState("busy");
    await unsubscribeFromPush();
    try { localStorage.removeItem(STAFF_PUSH_KEY); } catch { /* ignore */ }
    setState("off");
  }

  if (state === "hidden") return null;
  const on = state === "on";
  return (
    <div style={{ marginBottom: 8 }}>
      <button type="button" onClick={on ? turnOff : turnOn} disabled={state === "busy"}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
          padding: "10px 14px", borderRadius: 14, fontSize: 12.5, fontWeight: 750, cursor: "pointer",
          border: on ? "1px solid rgba(5,150,105,.35)" : "1px solid #7C3AED33",
          background: "#fff", color: on ? "#059669" : "#7C3AED",
        }}>
        {on ? <Bell size={15} /> : <BellOff size={15} />}
        {state === "busy" ? "One moment…" : on ? "Booking alerts on · turn off" : "Get booking alerts on this phone"}
      </button>
      {error && <div style={{ fontSize: 11, color: "#fca5a5", marginTop: 5, lineHeight: 1.4 }}>{error}</div>}
    </div>
  );
}
