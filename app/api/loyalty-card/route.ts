import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ensureAllTables } from "@/lib/db-schema";
import { backupExistingSalonData } from "@/lib/data-backup";
import { getTier, nextTierThreshold, pointsToRupees, type LoyaltySettings } from "@/lib/loyalty";
import type { Client } from "@/lib/types";
import { clientIp, rateLimit } from "@/lib/rate-limit";

interface SalonSettings {
  salon?: {
    name?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
  loyalty?: LoyaltySettings;
}

const defaultLoyalty: LoyaltySettings = {
  enabled: true,
  pointsPerRupee: 0.01,
  rupeePerPoint: 1,
  silverMin: 500,
  goldMin: 2000,
  platinumMin: 5000,
};

async function ensureTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS salon_data (
      entity     TEXT PRIMARY KEY,
      data       TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  // Normalize Pakistani numbers to 10-digit form (3XXXXXXXXX) so that
  // 03XXXXXXXXX, 923XXXXXXXXX, +923XXXXXXXXX all match each other.
  if (digits.startsWith("92") && digits.length >= 12) return digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11)  return digits.slice(1);
  return digits;
}

function formatCardNumber(id: string): string {
  const compact = id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().padEnd(16, "0").slice(0, 16);
  return `${compact.slice(0, 4)} ${compact.slice(4, 8)} ${compact.slice(8, 12)} ${compact.slice(12, 16)}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const result = await db.execute({
    sql: "SELECT data FROM salon_data WHERE entity = ?",
    args: [key],
  });
  if (result.rows.length === 0) return fallback;
  try {
    return JSON.parse(result.rows[0].data as string) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, data: unknown) {
  const userId = key.endsWith("_clients") ? key.slice(0, -"_clients".length) : key.split("_")[0];
  await backupExistingSalonData(key, userId);
  await db.execute({
    sql: "INSERT OR REPLACE INTO salon_data (entity, data, updated_at) VALUES (?, ?, ?)",
    args: [key, JSON.stringify(data), new Date().toISOString()],
  });
}

function rowToClient(row: Record<string, unknown>): Client {
  return {
    id: String(row.id),
    name: String(row.name || "Loyalty Member"),
    phone: String(row.phone || ""),
    email: typeof row.email === "string" ? row.email : undefined,
    tags: [],
    source: "web",
    createdAt: String(row.created_at || new Date().toISOString().slice(0, 10)),
    totalVisits: Number(row.total_visits || 0),
    totalSpend: Number(row.total_spent || 0),
    lastVisitDate: typeof row.last_visit === "string" ? row.last_visit : undefined,
    notes: typeof row.notes === "string" ? row.notes : undefined,
    loyaltyPoints: 0,
    loyaltyPointsEarned: 0,
  };
}

async function readClients(salonId: string): Promise<Client[]> {
  await ensureAllTables();

  // Read both sources in parallel — JSON has up-to-date loyalty points and phone changes,
  // SQL may have clients registered via loyalty card that aren't in the JSON yet.
  const [jsonClients, sqlResult] = await Promise.all([
    readJson<Client[]>(`${salonId}_clients`, []),
    db.execute({ sql: "SELECT * FROM clients WHERE user_id = ? ORDER BY created_at DESC", args: [salonId] }),
  ]);

  const sqlClients = sqlResult.rows.map((row) => rowToClient(row as Record<string, unknown>));

  if (jsonClients.length === 0) return sqlClients;
  if (sqlClients.length === 0) return jsonClients;

  // Merge: JSON wins for any client present in both (it has loyalty points + latest phone).
  // Include SQL-only clients so loyalty-card-registered-but-not-yet-synced clients are findable.
  const jsonIds = new Set(jsonClients.map((c) => c.id));
  const sqlOnly = sqlClients.filter((c) => !jsonIds.has(c.id));
  return [...jsonClients, ...sqlOnly];
}

async function insertRelationalClient(salonId: string, client: Client) {
  await ensureAllTables();
  await db.execute({
    sql: `
      INSERT OR IGNORE INTO clients (
        id, user_id, name, phone, email, notes, total_visits, total_spent, last_visit, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      client.id,
      salonId,
      client.name,
      client.phone,
      client.email || null,
      client.notes || null,
      client.totalVisits || 0,
      client.totalSpend || 0,
      client.lastVisitDate || null,
      client.createdAt,
    ],
  });
}

async function readSalonSettings(salonId: string): Promise<SalonSettings> {
  const settings = await readJson<SalonSettings>(`${salonId}_settings`, {});
  if (settings.salon?.name) return settings;

  try {
    await ensureAllTables();
    const result = await db.execute({
      sql: "SELECT salon_name, phone, email FROM users WHERE id = ?",
      args: [salonId],
    });
    const user = result.rows[0] as Record<string, unknown> | undefined;
    if (user) {
      return {
        ...settings,
        salon: {
          ...settings.salon,
          name: typeof user.salon_name === "string" ? user.salon_name : settings.salon?.name,
          phone: typeof user.phone === "string" ? user.phone : settings.salon?.phone,
          email: typeof user.email === "string" ? user.email : settings.salon?.email,
        },
      };
    }
  } catch {
    // Keep the public QR flow available even if the optional user fallback fails.
  }

  return settings;
}

// Public page, no login: whoever types a phone number sees only what the card shows — a first
// name and points. Never the stored record (spend, notes, birthday, medical details…).
function publicClient(client: Client) {
  return {
    id: client.id,
    name: (client.name || "").trim().split(/\s+/)[0] || "Loyalty Member",
    loyaltyPoints: client.loyaltyPoints ?? 0,
    loyaltyPointsEarned: client.loyaltyPointsEarned ?? 0,
  };
}

// Lookups by phone number are capped per visitor so nobody can try number after number.
const tooMany = async (req: NextRequest, action: string, max: number) =>
  (await rateLimit(`loyalty-card-${action}`, clientIp(req), { maxAttempts: max, windowMs: 10 * 60 * 1000, blockMs: 30 * 60 * 1000 })).blocked;
const slowDown = () => Response.json({ ok: false, error: "Too many tries. Please wait a few minutes and try again." }, { status: 429 });

function cardPayload(client: Client, settings: LoyaltySettings, salon: SalonSettings["salon"]) {
  const earned = client.loyaltyPointsEarned ?? 0;
  const balance = client.loyaltyPoints ?? 0;
  const tier = getTier(earned, settings);
  const next = nextTierThreshold(earned, settings);
  return {
    salon: {
      name: salon?.name || "Salon Central",
      phone: salon?.phone || "",
      email: salon?.email || "",
      logo: salon?.logo || "",
    },
    client: publicClient(client),
    card: {
      number: formatCardNumber(client.id),
      tier,
      balance,
      earned,
      redeemableValue: pointsToRupees(balance, settings.rupeePerPoint),
      nextTier: next,
    },
    settings,
  };
}

export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get("salonId");
  const phone = req.nextUrl.searchParams.get("phone");
  if (!salonId) return Response.json({ ok: false, error: "Missing salonId" }, { status: 400 });

  try {
    await ensureTable();
    const settings = await readSalonSettings(salonId);
    const loyalty = { ...defaultLoyalty, ...(settings.loyalty || {}) };
    const clients = await readClients(salonId);

    const noCache = { headers: { "Cache-Control": "no-store" } };

    if (phone && await tooMany(req, "lookup", 15)) return slowDown();
    if (!phone) {
      return Response.json({
        ok: true,
        salon: settings.salon || { name: "Salon Central" },
        settings: loyalty,
      }, noCache);
    }

    const normalized = normalizePhone(phone);
    const client = clients.find((item) => normalizePhone(item.phone) === normalized);
    if (!client) {
      return Response.json({
        ok: true,
        salon: settings.salon || { name: "Salon Central" },
        settings: loyalty,
        client: null,
      }, noCache);
    }

    return Response.json({ ok: true, ...cardPayload(client, loyalty, settings.salon) }, noCache);
  } catch (err) {
    console.error("[loyalty-card] GET error:", err);
    return Response.json({ ok: false, error: "Unable to load loyalty card." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: { salonId?: string; phone?: string; name?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const salonId = body.salonId;
  const phone = body.phone?.trim();
  if (!salonId || !phone) return Response.json({ ok: false, error: "Missing salonId or phone" }, { status: 400 });
  if (await tooMany(req, "claim", 8)) return slowDown();

  try {
    await ensureTable();
    const settings = await readSalonSettings(salonId);
    const loyalty = { ...defaultLoyalty, ...(settings.loyalty || {}) };
    const key = `${salonId}_clients`;
    const clients = await readClients(salonId);
    const normalized = normalizePhone(phone);
    let client = clients.find((item) => normalizePhone(item.phone) === normalized);

    if (!client) {
      client = {
        id: `lc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: body.name?.trim() || "Loyalty Member",
        phone,
        email: body.email?.trim() || undefined,
        tags: ["Loyalty"],
        source: "web",
        createdAt: new Date().toISOString().split("T")[0],
        totalVisits: 0,
        totalSpend: 0,
        loyaltyPoints: 0,
        loyaltyPointsEarned: 0,
      };
      await writeJson(key, [client, ...clients]);
      await insertRelationalClient(salonId, client);
    }

    return Response.json({ ok: true, created: !clients.some((item) => item.id === client.id), ...cardPayload(client, loyalty, settings.salon) });
  } catch (err) {
    console.error("[loyalty-card] POST error:", err);
    return Response.json({ ok: false, error: "Unable to create loyalty card." }, { status: 500 });
  }
}
