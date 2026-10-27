"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Printer } from "lucide-react";
import type { Payout } from "@/lib/payouts";
import { settingsStore } from "@/lib/settings-store";
import SalonCentralWordmark from "@/components/salon-central-wordmark";
import { fmtCurrency as fmt } from "@/lib/format";

function fmtDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-PK", {
    year: "numeric", month: "long", day: "numeric",
  });
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash", jazzcash: "JazzCash", easypaisa: "EasyPaisa",
  raast: "Raast", card: "Card", bank: "Bank Transfer", other: "Other", "": "—",
};

const PRINT_STYLES = `
  @media print {
    body > *:not(#payout-slip-portal) { display: none !important; }
    #payout-slip-portal {
      display: block !important; position: fixed !important;
      inset: 0 !important; background: #fff !important;
      z-index: 99999 !important; overflow: visible !important;
    }
    .psp-overlay  { background: transparent !important; padding: 0 !important; overflow: visible !important; }
    .psp-no-print { display: none !important; }
    .psp-sheet    { border-radius: 0 !important; box-shadow: none !important; max-width: 100% !important; width: 100% !important; margin: 0 !important; }
    @page { size: A4 portrait; margin: 18mm 16mm; }
  }
`;

interface Props {
  payout: Payout;
  staffPhone?: string;
  salonName: string;
  salonPhone: string;
  salonEmail: string;
  salonAddress: string;
  onClose: () => void;
}

export default function PayoutSlipPrint({
  payout, staffPhone, salonName, salonPhone, salonEmail, salonAddress, onClose,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const isPaid   = payout.status === "paid";
  const logo     = (settingsStore.salon as { logo?: string }).logo || "";
  const initials = salonName.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");

  // The upsell incentive is folded into baseAmount, so it has to be taken back
  // out before the salary line is derived — otherwise "Base Salary" would silently
  // absorb it and the slip wouldn't add up against the stylist's own arithmetic.
  const upsellAmount = payout.upsellAmount ?? 0;
  const rows: { label: string; amount?: string }[] = [];
  if (payout.payType === "commission" || payout.payType === "both") {
    const commissionAmount = Math.round(payout.revenueGenerated * (payout.commissionRate ?? 0) / 100);
    rows.push({ label: `Revenue Generated (${fmtDate(payout.periodStart)} – ${fmtDate(payout.periodEnd)})`, amount: fmt(payout.revenueGenerated) });
    rows.push({ label: `Commission (${payout.commissionRate ?? 0}%)`, amount: fmt(commissionAmount) });
    if (payout.payType === "both") {
      rows.push({ label: "Base Salary", amount: fmt(payout.baseAmount - commissionAmount - upsellAmount) });
    }
  } else {
    rows.push({ label: "Base Salary", amount: fmt(payout.baseAmount - upsellAmount) });
  }
  if (upsellAmount > 0) {
    rows.push({ label: `Upsold Services${payout.upsellValue ? ` (${fmt(payout.upsellValue)})` : ""}`, amount: "" });
    rows.push({ label: `Upsell Incentive (${payout.upsellRate ?? 0}%)`, amount: fmt(upsellAmount) });
  }

  const content = (
    <div id="payout-slip-portal" translate="no" dir="ltr">
      <style>{PRINT_STYLES}</style>

      <div
        className="psp-overlay"
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px", overflowY: "auto" }}
      >
        <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 760, display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Toolbar */}
          <div className="psp-no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", opacity: 0.9 }}>{payout.staffName} · {fmtDate(payout.periodStart)} – {fmtDate(payout.periodEnd)}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => window.print()}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.15)", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                <Printer size={14} /> Print / Save PDF
              </button>
              <button type="button" onClick={onClose} aria-label="Close salary slip"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 9, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.15)", cursor: "pointer" }}>
                <X size={16} color="#fff" />
              </button>
            </div>
          </div>

          {/* Slip Sheet */}
          <div className="psp-sheet" style={{ background: "#fff", borderRadius: 4, boxShadow: "0 24px 80px rgba(0,0,0,0.3)", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
            <div style={{ padding: "48px 52px" }}>

              {/* ── HEADER: Company left, Logo right ── */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 48 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#111", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>{salonName}</div>
                  <div style={{ fontSize: 12, color: "#555", lineHeight: 2 }}>
                    {salonAddress && <div>{salonAddress}</div>}
                    {salonEmail   && <div>{salonEmail}</div>}
                    {salonPhone   && <div>{salonPhone}</div>}
                  </div>
                </div>

                {/* Logo */}
                {logo ? (
                  <img src={logo} alt={salonName} style={{ height: 90, maxWidth: 160, objectFit: "contain" }} />
                ) : (
                  <div style={{ width: 90, height: 90, borderRadius: "50%", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-1px" }}>{initials}</span>
                  </div>
                )}
              </div>

              {/* ── PAY TO / PAYSLIP ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginBottom: 40 }}>
                {/* Pay To */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#111", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Pay To</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 4 }}>{payout.staffName}</div>
                  <div style={{ fontSize: 12, color: "#555", lineHeight: 1.9 }}>
                    {staffPhone && <div>{staffPhone}</div>}
                  </div>
                </div>

                {/* Payslip details */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#111", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Payslip</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <tbody>
                      {[
                        ["Pay Period:", `${fmtDate(payout.periodStart)} – ${fmtDate(payout.periodEnd)}`],
                        ["Pay Type:", payout.payType === "commission" ? "Commission" : payout.payType === "both" ? "Commission + Salary" : "Fixed Salary"],
                        ["Payment:", payout.paymentMethod ? (METHOD_LABELS[payout.paymentMethod] ?? payout.paymentMethod) : "—"],
                        ["Status:", isPaid ? "PAID" : "PENDING"],
                      ].map(([label, value]) => (
                        <tr key={label}>
                          <td style={{ padding: "3px 0", color: "#555", width: "45%" }}>{label}</td>
                          <td style={{ padding: "3px 0", color: "#111", fontWeight: 600, textAlign: "right" }}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── BREAKDOWN TABLE ── */}
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 28 }}>
                <thead>
                  <tr style={{ background: "#f0f0f0", borderTop: "1px solid #ccc", borderBottom: "1px solid #ccc" }}>
                    {["Description", "Amount"].map((h, i) => (
                      <th key={h} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 700, color: "#111", textTransform: "capitalize", letterSpacing: "0.03em", textAlign: i === 0 ? "left" : "right", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.label} style={{ borderBottom: "1px solid #e8e8e8" }}>
                      <td style={{ padding: "11px 12px", fontSize: 12, color: "#111" }}>{r.label}</td>
                      <td style={{ padding: "11px 12px", fontSize: 12, color: "#111", fontWeight: 600, textAlign: "right" }}>{r.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ── TOTALS ── */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 40 }}>
                <div style={{ width: 280 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, color: "#555", borderBottom: "1px solid #e8e8e8" }}>
                    <span style={{ fontWeight: 600 }}>Base Pay</span><span style={{ fontWeight: 700, color: "#111" }}>{fmt(payout.baseAmount)}</span>
                  </div>
                  {payout.adjustment !== 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, color: "#555", borderBottom: "1px solid #e8e8e8" }}>
                      <span>{payout.adjustmentNote || "Adjustment"}</span>
                      <span>{payout.adjustment > 0 ? "+" : ""}{fmt(payout.adjustment)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 14, borderTop: "2px solid #111", marginTop: 4 }}>
                    <span style={{ fontWeight: 800, color: "#111" }}>Total</span>
                    <span style={{ fontWeight: 900, color: "#111" }}>{fmt(payout.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* ── NOTES ── */}
              {payout.notes && (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#111", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Notes</div>
                  <div style={{ fontSize: 12, color: "#555", lineHeight: 1.8 }}>{payout.notes}</div>
                </div>
              )}

              {/* ── TERMS ── */}
              <div style={{ marginBottom: 36 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#111", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Terms</div>
                <div style={{ fontSize: 12, color: "#555", lineHeight: 1.8 }}>
                  This is a system-generated salary slip issued for the pay period stated above.<br />
                  For queries, contact us at {salonEmail || salonPhone}.
                </div>
              </div>

              {/* ── FOOTER ── */}
              <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 12, color: "#555" }}>
                  Thank you for your work, <strong style={{ color: "#111" }}>{payout.staffName}</strong>!
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: "#aaa" }}>Powered by</span>
                  <SalonCentralWordmark compact />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
