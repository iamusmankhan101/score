/**
 * lib/push-client.ts
 *
 * Browser-side Web Push helpers used by the client-facing PWA page.
 * Every function is safe to call during SSR — they check for the relevant
 * global and resolve to a "not supported" result rather than throwing.
 */

export type PushSupport =
  | { supported: true }
  | { supported: false; reason: string };

export type SubscribeResult =
  | { ok: true; endpoint: string }
  | { ok: false; error: string; permissionDenied?: boolean };

/**
 * Converts the base64url VAPID public key into the Uint8Array that
 * `pushManager.subscribe()` requires — base64url uses `-`/`_` where base64
 * uses `+`/`/`, and the padding the spec omits has to be restored before
 * atob() will accept it.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);

  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/** Why push can't be offered here — surfaced to the customer verbatim. */
export function checkPushSupport(): PushSupport {
  if (typeof window === "undefined") return { supported: false, reason: "Not available during rendering." };
  if (!("serviceWorker" in navigator)) {
    return { supported: false, reason: "This browser doesn't support background notifications." };
  }
  if (!("PushManager" in window)) {
    // iOS only exposes PushManager once the site is installed to the Home Screen.
    const isIos = /iP(hone|ad|od)/.test(navigator.userAgent);
    return {
      supported: false,
      reason: isIos
        ? "On iPhone and iPad, add this page to your Home Screen first — notifications work from the installed app."
        : "This browser doesn't support push notifications.",
    };
  }
  if (!("Notification" in window)) {
    return { supported: false, reason: "This browser doesn't support notifications." };
  }
  return { supported: true };
}

/** True when this device already has an active subscription. */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (checkPushSupport().supported === false) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

async function fetchVapidPublicKey(): Promise<string> {
  const res = await fetch("/api/push/public-key");
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok || !data.publicKey) {
    throw new Error(data?.error ?? "Notifications aren't available right now.");
  }
  return data.publicKey as string;
}

/**
 * Full opt-in flow: ask permission → subscribe with the server's VAPID key →
 * persist the subscription against this salon (and customer, when known).
 *
 * Reuses an existing subscription when the browser already has one, since
 * calling subscribe() twice with the same key returns the same endpoint anyway
 * and an extra prompt would just confuse the customer.
 */
export async function subscribeToPush(params: {
  salonId?: string;
  clientId?: string | null;
  /** A signed-in staff phone: saved for new-booking alerts instead of customer offers. */
  staff?: boolean;
}): Promise<SubscribeResult> {
  const support = checkPushSupport();
  if (!support.supported) return { ok: false, error: support.reason };

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        ok: false,
        permissionDenied: true,
        error:
          permission === "denied"
            ? "Notifications are blocked for this site. Enable them in your browser settings to get offers."
            : "Notification permission wasn't granted.",
      };
    }

    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const publicKey = await fetchVapidPublicKey();
      subscription = await registration.pushManager.subscribe({
        // Chrome refuses silent push: every message must show a notification.
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const res = await fetch(params.staff ? "/api/push/staff" : "/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salonId: params.salonId,
        clientId: params.clientId ?? null,
        subscription: subscription.toJSON(),
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error ?? "Couldn't save your notification settings." };
    }

    return { ok: true, endpoint: subscription.endpoint };
  } catch (err) {
    console.error("[push-client] subscribe failed:", err);
    return { ok: false, error: (err as Error).message || "Couldn't turn on notifications." };
  }
}

/** Opt back out: drop the browser subscription and the stored row together. */
export async function unsubscribeFromPush(): Promise<{ ok: boolean; error?: string }> {
  try {
    const subscription = await getExistingSubscription();
    if (!subscription) return { ok: true };

    const { endpoint } = subscription;
    await subscription.unsubscribe();
    await fetch(`/api/subscribe?endpoint=${encodeURIComponent(endpoint)}`, { method: "DELETE" })
      .catch(() => {});
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
