"use client";

/**
 * components/install-prompt.tsx
 *
 * Inline "Install App" button for the client-facing PWA.
 *
 * Two very different platforms to cover:
 *  - Chrome / Edge / Samsung Internet fire `beforeinstallprompt`, which we
 *    stash and replay from a real click (the event is only usable once, and
 *    only in response to a user gesture).
 *  - iOS Safari fires nothing and has no programmatic install, so the button
 *    opens short Share → "Add to Home Screen" instructions instead. This
 *    matters more than it sounds: on iOS, Web Push only works *after* the site
 *    is installed to the Home Screen, so a customer who skips this step will
 *    never receive an offer.
 *
 * Renders nothing once the app is already installed.
 */

import { useCallback, useEffect, useState } from "react";
import { Share, Plus, Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari's non-standard flag — the only signal iOS gives us.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function InstallPrompt({
  accent = "#7C3AED",
  iosNote = "On iPhone, offers and appointment reminders can only be delivered from the installed app.",
}: { accent?: string; iosNote?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(true);   // assume installed until mounted
  const [isIos, setIsIos] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    // iPadOS 13+ reports as a Mac; the touch-point check separates it from a desktop.
    const iosLike = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    setIsIos(iosLike);
    setInstalled(isStandalone());

    const onBeforeInstall = (event: Event) => {
      // Suppress Chrome's mini-infobar so our own button is the only prompt.
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      // The event can't be replayed; Chrome re-fires it later if still eligible.
      setDeferred(null);
      if (outcome === "accepted") setInstalled(true);
      return;
    }
    if (isIos) setShowIosHelp(true);
  }, [deferred, isIos]);

  // Nothing to offer: already installed, or a browser that can't install at all.
  if (installed) return null;
  if (!deferred && !isIos) return null;

  return (
    <>
      <button
        onClick={handleInstall}
        // Secondary styling on purpose: the page already has one filled accent
        // button pinned at the bottom ("Book appointment"). Two competing
        // full-width primaries read as a choice rather than a clear next step.
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", padding: "12px 18px", borderRadius: 14,
          border: `1px solid ${accent}33`, background: "#fff", color: accent,
          fontSize: 13.5, fontWeight: 750, cursor: "pointer",
        }}
      >
        <Download size={16} /> Install App
      </button>

      {showIosHelp && (
        <div
          onClick={() => setShowIosHelp(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000, background: "rgba(16,12,32,.55)",
            display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 420, background: "#fff", borderRadius: 20,
              padding: "22px 20px calc(22px + env(safe-area-inset-bottom))",
              boxShadow: "0 -8px 40px rgba(38,25,75,.22)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 17, color: "#1a1a2e" }}>Add to Home Screen</h3>
              <button
                onClick={() => setShowIosHelp(false)}
                aria-label="Close"
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "#9898b0", padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, color: "#5b5b78", fontSize: 14, lineHeight: 2 }}>
              <li>
                Tap the <Share size={14} style={{ verticalAlign: "-2px" }} /> <strong>Share</strong> button
                in Safari&apos;s toolbar
              </li>
              <li>
                Scroll down and choose <Plus size={14} style={{ verticalAlign: "-2px" }} />{" "}
                <strong>Add to Home Screen</strong>
              </li>
              <li>Tap <strong>Add</strong> — then open the app from your Home Screen</li>
            </ol>
            <p style={{ margin: "14px 0 0", fontSize: 12.5, lineHeight: 1.6, color: "#9898b0" }}>
              {iosNote}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
