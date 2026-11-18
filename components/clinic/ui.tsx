"use client";

/** Small shared pieces for the clinic list pages (lab orders, quotations, purchase orders, documents). */

import { X } from "lucide-react";

export const INP: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "9px 11px", borderRadius: 9, border: "1px solid #e4e4ee", fontSize: 13, color: "#1a1a2e", outline: "none", background: "#fff" };
export const PAGE: React.CSSProperties = { minHeight: "100vh", background: "#fff", padding: "28px 32px 48px", display: "flex", flexDirection: "column", gap: 18 };
export const ROW: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "1px solid #ececf4", borderRadius: 12, flexWrap: "wrap" };
export const BTN_PRIMARY: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "none", background: "#7C3AED", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" };
export const BTN_SMALL: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 11px", borderRadius: 8, border: "1px solid #e4e4ee", background: "#fff", color: "#6b6b8a", fontSize: 12, fontWeight: 800, cursor: "pointer", textDecoration: "none" };

export function Small({ children }: { children: React.ReactNode }) {
  return <span style={{ display: "block", fontSize: 10.5, fontWeight: 800, color: "#9898b0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{children}</span>;
}

export function Chip({ children, color = "#6b6b8a", bg = "#f4f4f8" }: { children: React.ReactNode; color?: string; bg?: string }) {
  return <span style={{ fontSize: 11, fontWeight: 800, color, background: bg, borderRadius: 999, padding: "3px 9px" }}>{children}</span>;
}

export function Modal({ title, onClose, children, maxWidth = 520 }: { title: string; onClose: () => void; children: React.ReactNode; maxWidth?: number }) {
  return (
    <div onClick={onClose} className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="modal-sheet" style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth, maxHeight: "92vh", overflowY: "auto", padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 900, color: "#1a1a2e" }}>{title}</div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ border: "none", background: "rgba(0,0,0,0.06)", borderRadius: 8, padding: 7, cursor: "pointer", display: "flex" }}><X size={14} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SaveButton({ enabled, onClick, children }: { enabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" disabled={!enabled} onClick={onClick}
      style={{ marginTop: 16, width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: enabled ? "#7C3AED" : "#e8e8f0", color: enabled ? "#fff" : "#9898b0", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
      {children}
    </button>
  );
}
