import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";
import { resolveActor } from "@/lib/api-auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getTier, nextTierThreshold, pointsToRupees, type LoyaltySettings } from "@/lib/loyalty";
import type { Client } from "@/lib/types";
import {
  GOOGLE_WALLET_ISSUER_ID as ISSUER_ID,
  GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL as SERVICE_ACCOUNT_EMAIL,
  getGoogleWalletPrivateKey as getPrivateKey,
  googleWalletConfigured,
  getGoogleWalletAccessToken,
  ensureGoogleWalletLoyaltyClass,
} from "@/lib/google-wallet";

const defaultLoyalty: LoyaltySettings = {
  enabled: true, pointsPerRupee: 0.01, rupeePerPoint: 1,
  silverMin: 500, goldMin: 2000, platinumMin: 5000,
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const result = await db.execute({ sql: "SELECT data FROM salon_data WHERE entity = ?", args: [key] });
    if (result.rows.length === 0) return fallback;
    return JSON.parse(result.rows[0].data as string) as T;
  } catch { return fallback; }
}

async function getClient(salonId: string, clientId: string): Promise<Client | null> {
  const clients = await readJson<Client[]>(`${salonId}_clients`, []);
  const found = clients.find(c => c.id === clientId);
  if (found) return found;
  try {
    const result = await db.execute({
      sql: "SELECT * FROM clients WHERE id = ? AND user_id = ?",
      args: [clientId, salonId],
    });
    if (result.rows.length === 0) return null;
    const row = result.rows[0] as Record<string, unknown>;
    return {
      id: String(row.id), name: String(row.name || "Loyalty Member"),
      phone: String(row.phone || ""), tags: [], source: "web",
      createdAt: String(row.created_at || ""),
      totalVisits: Number(row.total_visits || 0),
      totalSpend: Number(row.total_spent || 0),
      loyaltyPoints: Number(row.loyalty_points || 0),
      loyaltyPointsEarned: Number(row.loyalty_points_earned || 0),
    };
  } catch { return null; }
}

async function getSalonInfo(salonId: string): Promise<{ name: string; settings: LoyaltySettings }> {
  const settings = await readJson<{ salon?: { name?: string }; loyalty?: Partial<LoyaltySettings> }>(`${salonId}_settings`, {});
  let name = settings.salon?.name || "";
  if (!name) {
    try {
      const result = await db.execute({ sql: "SELECT salon_name FROM users WHERE id = ?", args: [salonId] });
      const n = result.rows[0]?.salon_name;
      if (typeof n === "string" && n) name = n;
    } catch { /* fall through */ }
  }
  return {
    name: name || "Salon Central",
    settings: { ...defaultLoyalty, ...(settings.loyalty || {}) },
  };
}

/**
 * POST and PATCH write the pass itself, so: a signed-in salon login, and a client from its
 * own salon (the salon comes from the session, never the body). The page's fresh copy is
 * used — it can be a beat ahead of storage — but pinned to the stored record's id.
 */
async function ownClient(req: NextRequest, clientId?: string, fresh?: Client): Promise<{ salonId: string; client: Client } | null> {
  const actor = await resolveActor(req);
  if (!actor || !clientId) return null;
  const stored = await getClient(actor.userId, clientId);
  if (!stored) return null;
  return { salonId: actor.userId, client: fresh ? { ...fresh, id: stored.id } : stored };
}

function safeId(str: string) {
  return str.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
}

function buildObjectPayload(objectId: string, client: Client, salonName: string, ls: LoyaltySettings, appBaseUrl: string) {
  const classId = `${ISSUER_ID}.werzio-loyalty`;
  const balance = client.loyaltyPoints ?? 0;
  const earned  = client.loyaltyPointsEarned ?? 0;
  const tier    = getTier(earned, ls);
  const next    = nextTierThreshold(earned, ls);
  const value   = pointsToRupees(balance, ls.rupeePerPoint);

  const tierLabels: Record<string, string> = {
    platinum: "Platinum 💎", gold: "Gold 🥇",
    silver: "Silver 🥈",    bronze: "Bronze 🥉", none: "Member ⭐",
  };

  return {
    id: objectId,
    classId,
    state: "ACTIVE",
    accountId:   client.phone || client.id,
    accountName: client.name,
    loyaltyPoints: {
      balance: { int: balance },
      label: "Points",
    },
    secondaryLoyaltyPoints: {
      balance: { money: { currencyCode: "PKR", micros: value * 1_000_000 } },
      label: "Cashback",
    },
    textModulesData: [
      { header: "Salon",            body: salonName,                                                                      id: "salon"    },
      { header: "Redeemable Value", body: `PKR ${value.toLocaleString()}`,                                                id: "value"    },
      { header: "Lifetime Earned",  body: `${earned.toLocaleString()} pts`,                                               id: "earned"   },
      { header: "Tier",             body: tierLabels[tier] ?? "Member ⭐",                                                id: "tier"     },
      { header: "Next Tier",        body: next ? `${next.needed} pts needed for ${tierLabels[next.tier]}` : "Top tier 🏆", id: "next_tier" },
    ],
    heroImage: {
      sourceUri: { uri: `${appBaseUrl}/api/wallet/hero-banner?name=${encodeURIComponent(salonName)}` },
      contentDescription: { defaultValue: { language: "en-US", value: salonName } },
    },
    barcode: {
      type: "QR_CODE",
      value: `${appBaseUrl}/loyalty-card/${encodeURIComponent(client.id)}`,
      alternateText: client.phone || client.id,
    },
  };
}

function generateWalletUrl(client: Client, salonName: string, ls: LoyaltySettings, appBaseUrl: string): string {
  const privateKey = getPrivateKey();
  const objectId   = `${ISSUER_ID}.werzio-loyalty_${safeId(client.id)}`;
  const payload    = buildObjectPayload(objectId, client, salonName, ls, appBaseUrl);

  const claims = {
    iss: SERVICE_ACCOUNT_EMAIL,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    payload: { loyaltyObjects: [payload] },
  };

  const token = jwt.sign(claims, privateKey, { algorithm: "RS256" });
  return `https://pay.google.com/gp/v/save/${token}`;
}

async function upsertObject(client: Client, salonName: string, ls: LoyaltySettings, appBaseUrl: string): Promise<void> {
  const objectId  = `${ISSUER_ID}.werzio-loyalty_${safeId(client.id)}`;
  const objectUrl = `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${encodeURIComponent(objectId)}`;
  const token     = await getGoogleWalletAccessToken();
  const headers   = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
  const payload   = buildObjectPayload(objectId, client, salonName, ls, appBaseUrl);
  const patchPayload = {
    state: payload.state,
    accountId: payload.accountId,
    accountName: payload.accountName,
    loyaltyPoints: payload.loyaltyPoints,
    secondaryLoyaltyPoints: payload.secondaryLoyaltyPoints,
    textModulesData: payload.textModulesData,
    heroImage: payload.heroImage,
    barcode: payload.barcode,
  };

  // PATCH only mutable fields. Sending id/classId back can cause Google to
  // reject an otherwise valid update for a pass that is already installed.
  const patchRes = await fetch(objectUrl, {
    method: "PATCH",
    headers,
    body: JSON.stringify(patchPayload),
  });
  if (patchRes.status === 404) {
    const insertRes = await fetch("https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject",
      { method: "POST", headers, body: JSON.stringify(payload) });
    if (!insertRes.ok) {
      throw new Error(`Google Wallet insert failed (${insertRes.status}): ${await insertRes.text()}`);
    }
    return;
  }
  if (!patchRes.ok) {
    throw new Error(`Google Wallet update failed (${patchRes.status}): ${await patchRes.text()}`);
  }
}

async function updateClass(appBaseUrl: string, salonName: string): Promise<void> {
  // Calls the class-update logic in-process rather than fetching our own
  // `/api/wallet/update-class` route over HTTP — a self-fetch back to the
  // current deployment can hit a stale domain, deployment-protection page,
  // or a "build in progress" placeholder and return non-JSON, which broke
  // `response.json()` here with "Unexpected token... is not valid JSON".
  const result = await ensureGoogleWalletLoyaltyClass({ salonName, appOrigin: appBaseUrl });
  if (!result.ok) {
    throw new Error(result.error || "Google Wallet class update failed.");
  }
}

/**
 * PATCH /api/wallet/loyalty
 * Body: { salonId, clientId }
 * Silently updates an existing Google Wallet pass with the latest points.
 * Called automatically after every loyalty point change (award/redeem/adjust).
 * Returns 204 on success, 200 with ok:false if credentials not configured.
 */
export async function PATCH(req: NextRequest) {
  if (!googleWalletConfigured()) {
    return Response.json({ ok: false, error: "Google Wallet credentials are not configured." }, { status: 501 });
  }
  try {
    const body = await req.json() as { clientId?: string; client?: Client };
    const own = await ownClient(req, body.clientId, body.client);
    if (!own) return Response.json({ ok: false, error: "Client not found." }, { status: 404 });
    const { client } = own;
    const { name: salonName, settings } = await getSalonInfo(own.salonId);

    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.saloncentral.xyz";
    await upsertObject(client, salonName, settings, appBaseUrl);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[wallet/loyalty] sync error:", err);
    return Response.json({ ok: false, error: "Google Wallet pass update failed." }, { status: 502 });
  }
}

/**
 * POST /api/wallet/loyalty
 * Refreshes the installed pass from the fresh client state and returns its
 * Save to Google Wallet URL. This avoids re-reading a just-updated balance
 * from eventually consistent storage.
 */
export async function POST(req: NextRequest) {
  if (!googleWalletConfigured()) {
    return Response.json({ ok: false, error: "Google Wallet credentials are not configured." }, { status: 501 });
  }

  try {
    const body = await req.json() as {
      platform?: string;
      client?: Client;
    };
    const { platform } = body;
    if (platform !== "google") {
      return Response.json({ ok: false, error: platform === "apple" ? "Apple Wallet is not configured yet." : "Unsupported wallet platform." }, { status: 501 });
    }
    const own = await ownClient(req, body.client?.id, body.client);
    if (!own) return Response.json({ ok: false, error: "Client not found." }, { status: 404 });
    const { client } = own;

    const { name: salonName, settings } = await getSalonInfo(own.salonId);
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    // The class must exist before Google will accept an object referencing it.
    await updateClass(appBaseUrl, salonName);
    await upsertObject(client, salonName, settings, appBaseUrl);

    return Response.json({
      ok: true,
      url: generateWalletUrl(client, salonName, settings, appBaseUrl),
    });
  } catch (err) {
    console.error("[wallet/loyalty] refresh error:", err);
    return Response.json({
      ok: false,
      error: err instanceof Error ? err.message : "Google Wallet pass update failed.",
    }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  const platform  = req.nextUrl.searchParams.get("platform");
  const salonId   = req.nextUrl.searchParams.get("salonId");
  const clientId  = req.nextUrl.searchParams.get("clientId");

  if (!platform || !salonId || !clientId) {
    return Response.json({ ok: false, error: "Missing platform, salonId, or clientId" }, { status: 400 });
  }
  // Public, like the loyalty card page: cap guesses at client ids.
  const limit = await rateLimit("wallet-loyalty", clientIp(req), { maxAttempts: 10, windowMs: 10 * 60 * 1000, blockMs: 30 * 60 * 1000 });
  if (limit.blocked) return Response.json({ ok: false, error: "Too many tries. Please wait a few minutes and try again." }, { status: 429 });
  if (platform === "apple") {
    return Response.json({ ok: false, error: "Apple Wallet is not configured yet." }, { status: 501 });
  }
  if (platform !== "google") {
    return Response.json({ ok: false, error: "Unsupported wallet platform" }, { status: 400 });
  }
  if (!googleWalletConfigured()) {
    return Response.json({ ok: false, error: "Google Wallet credentials are not configured." }, { status: 501 });
  }

  try {
    const [client, { name: salonName, settings }] = await Promise.all([
      getClient(salonId, clientId),
      getSalonInfo(salonId),
    ]);

    // The id alone isn't proof: older ids are time-based and guessable. The card page also
    // sends the phone number it was looked up by, and it has to match this client's.
    const lastDigits = (p: string) => p.replace(/\D/g, "").slice(-10);
    const phone = req.nextUrl.searchParams.get("phone") ?? "";
    if (!client || !phone || lastDigits(phone) !== lastDigits(client.phone)) {
      return Response.json({ ok: false, error: "Client not found." }, { status: 404 });
    }

    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    await updateClass(appBaseUrl, salonName);
    await upsertObject(client, salonName, settings, appBaseUrl);
    const url = generateWalletUrl(client, salonName, settings, appBaseUrl);

    return Response.json({ ok: true, url });
  } catch (err) {
    console.error("[wallet/loyalty] error:", err);
    return Response.json({
      ok: false,
      error: err instanceof Error ? err.message : "Wallet pass generation failed.",
    }, { status: 500 });
  }
}
