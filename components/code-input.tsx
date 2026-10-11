"use client";

/**
 * Six-box one-time-code field (sign-in and two-step settings).
 * One real input sits over the boxes, so paste, iOS/Android code autofill and screen
 * readers all see a normal field; the boxes only draw its digits and the next empty slot.
 */

import { useRef, useState } from "react";

const ACCENT = "#7c3aed";

export default function CodeInput({
  value,
  onChange,
  onEnter,
  autoFocus = false,
  label = "6-digit code",
  length = 6,
}: {
  value: string;
  onChange: (code: string) => void;
  onEnter?: () => void;
  autoFocus?: boolean;
  label?: string;
  length?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(autoFocus);
  const active = Math.min(value.length, length - 1);

  return (
    <div
      onClick={() => ref.current?.focus()}
      style={{
        position: "relative", display: "grid", gap: 12, width: "100%", maxWidth: length * 64 + (length - 1) * 12,
        gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))`, cursor: "text",
      }}
    >
      {Array.from({ length }, (_, i) => {
        const isActive = focused && i === active;
        return (
          <div
            key={i}
            aria-hidden="true"
            style={{
              aspectRatio: "1", borderRadius: 10, background: "#fff",
              border: `1.5px solid ${isActive ? ACCENT : "#c9c7c4"}`,
              boxShadow: isActive ? "0 0 0 4px rgba(124, 58, 237, 0.15)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 700, color: "#1a1a2e", transition: "border-color .12s, box-shadow .12s",
            }}
          >
            {value[i] ?? ""}
          </div>
        );
      })}
      <input
        ref={ref}
        value={value}
        aria-label={label}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        // No maxLength: it would cut a pasted "123 456" before the space is removed.
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, length))}
        onKeyDown={(e) => { if (e.key === "Enter" && onEnter) onEnter(); }}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0,
          border: 0, padding: 0, background: "transparent",
          fontSize: 16, // 16px+ stops iOS zooming in on focus
        }}
      />
    </div>
  );
}
