"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** How long a code must be out of view before seeing it again counts as a new scan. */
const RESCAN_AFTER_MS = 2500;

function cameraErrorMessage(err: unknown): string {
  const name = (err as { name?: string } | null)?.name;
  if (name === "NotAllowedError" || name === "SecurityError") return "Camera access is blocked. Allow the camera for this site in your browser settings, then try again.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No camera was found on this device.";
  if (name === "NotReadableError") return "The camera is being used by another app. Close it and try again.";
  return "Couldn't start the camera. Please try again.";
}

/**
 * Full-screen camera view that reads barcodes. Closes after the first code,
 * or with `continuous` stays open for the next one (`status` shows the result
 * of the last scan, since the page behind is covered).
 */
export default function BarcodeCameraScanner({ onDetected, onClose, continuous, status }: {
  onDetected: (code: string) => void;
  onClose: () => void;
  continuous?: boolean;
  status?: { ok: boolean; message: string } | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const callbacks = useRef({ onDetected, onClose });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { callbacks.current = { onDetected, onClose }; });

  useEffect(() => {
    let stopped = false;
    let controls: { stop: () => void } | undefined;
    let last = { code: "", at: 0 };

    (async () => {
      try {
        // Only pages where someone opens the camera download the decoder.
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([import("@zxing/browser"), import("@zxing/library")]);
        if (stopped) return;
        if (!navigator.mediaDevices?.getUserMedia) {
          setError("This browser can't use the camera here. Open the site over https in Chrome or Safari.");
          return;
        }
        const reader = new BrowserMultiFormatReader(new Map<never, unknown>([
          [DecodeHintType.POSSIBLE_FORMATS as never, [
            BarcodeFormat.CODE_128, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
            BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_39,
          ]],
          [DecodeHintType.TRY_HARDER as never, true],
        ]));
        const started = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current!,
          (result) => {
            if (!result || stopped) return;
            const code = result.getText().trim();
            const now = Date.now();
            const repeat = code === last.code && now - last.at < RESCAN_AFTER_MS;
            last = { code, at: now };
            if (repeat) return;
            navigator.vibrate?.(80);
            callbacks.current.onDetected(code);
            if (!continuous) callbacks.current.onClose();
          },
        );
        if (stopped) started.stop();
        else controls = started;
      } catch (err) {
        if (!stopped) setError(cameraErrorMessage(err));
      }
    })();

    return () => { stopped = true; controls?.stop(); };
  }, [continuous]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Scan barcode with camera"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } }}
      style={{ position: "fixed", inset: 0, zIndex: 10000, background: "#000", color: "#fff", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Point the camera at the barcode</span>
        <button type="button" autoFocus onClick={onClose} aria-label="Close camera"
          style={{ width: 44, height: 44, border: "none", borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={20} color="#fff" />
        </button>
      </div>
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <video ref={videoRef} muted playsInline autoPlay style={{ width: "100%", height: "100%", objectFit: "cover", display: error ? "none" : "block" }} />
        {!error && <div aria-hidden style={{ position: "absolute", top: "50%", left: "50%", width: "80%", maxWidth: 420, height: 130, transform: "translate(-50%, -50%)", border: "2px solid #fff", borderRadius: 12, boxShadow: "0 0 0 100vmax rgba(0,0,0,0.35)" }} />}
        {error && <div role="alert" style={{ padding: "48px 24px", textAlign: "center", fontSize: 14, lineHeight: 1.5 }}>{error}</div>}
      </div>
      <div aria-live="polite" style={{ minHeight: 52, padding: "16px", textAlign: "center", fontSize: 13, fontWeight: 600, color: status ? (status.ok ? "#6ee7b7" : "#fca5a5") : "#d4d4d8" }}>
        {status?.message ?? (continuous ? "Each product you scan is added to the bill." : "")}
      </div>
    </div>,
    document.body,
  );
}
