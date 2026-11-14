"use client";

import { useState } from "react";
import { blankHeaderOn, setBlankHeader } from "@/lib/clinic-wa";

/** "Pre-printed paper" switch: PDFs you print or download leave the header empty. WhatsApp copies always keep the letterhead. */
export default function BlankHeaderToggle() {
  const [on, setOn] = useState(() => blankHeaderOn());
  return (
    <label title="Tick this if you print on paper that already has the clinic letterhead" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b6b8a", cursor: "pointer", userSelect: "none" }}>
      <input type="checkbox" checked={on} onChange={(e) => { setOn(e.target.checked); setBlankHeader(e.target.checked); }} style={{ accentColor: "#7C3AED" }} />
      Pre-printed letterhead paper (leave the header blank)
    </label>
  );
}
