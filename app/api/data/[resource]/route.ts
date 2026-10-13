/**
 * Generic CRUD API for all resources — scoped to the authenticated caller's
 * own data (userId is resolved from the session, never trusted from the
 * client) and with column names validated before being interpolated into
 * SQL (Turso/libSQL has no parameterized-identifier support).
 *
 * GET    /api/data/[resource]          - List all (caller's own records)
 * POST   /api/data/[resource]          - Create
 * PUT    /api/data/[resource]          - Update
 * DELETE /api/data/[resource]?id=xxx   - Delete
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ensureAllTables } from "@/lib/db-schema";
import { can, resolveActor } from "@/lib/api-auth";

const VALID_RESOURCES = [
  "appointments",
  "clients",
  "staff",
  "services",
  "products",
  "invoices",
  "settings",
  "payment_requests",
  "user_plans",
];

// Column identifiers must be plain snake/camel-case names — never trust
// request-body keys directly in a SQL string without this check.
const SAFE_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function sanitizeColumns(keys: string[]): string[] | null {
  return keys.every((k) => SAFE_IDENTIFIER.test(k)) ? keys : null;
}

// ─── GET - List all records ───────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const { resource } = await params;

  if (!VALID_RESOURCES.includes(resource)) {
    return Response.json({ ok: false, error: "Invalid resource" }, { status: 400 });
  }

  const actor = await resolveActor(req);
  if (!actor) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    await ensureAllTables();

    const result = await db.execute({
      sql: `SELECT * FROM ${resource} WHERE user_id = ? ORDER BY created_at DESC`,
      args: [actor.userId],
    });

    return Response.json({ ok: true, data: result.rows });
  } catch (err) {
    console.error(`[api/data/${resource}] GET error:`, err);
    return Response.json({ ok: false, error: "Failed to fetch data" }, { status: 500 });
  }
}

// ─── POST - Create new record ─────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const { resource } = await params;

  if (!VALID_RESOURCES.includes(resource)) {
    return Response.json({ ok: false, error: "Invalid resource" }, { status: 400 });
  }

  const actor = await resolveActor(req);
  if (!actor) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  try {
    await ensureAllTables();

    // Always write under the caller's own id — never a client-supplied one.
    body.user_id = actor.userId;

    // Generate ID if not provided
    if (!body.id) {
      body.id = `${resource.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }

    // Add timestamps
    if (!body.created_at) {
      body.created_at = new Date().toISOString();
    }

    // Build INSERT query
    const columns = sanitizeColumns(Object.keys(body));
    if (!columns) {
      return Response.json({ ok: false, error: "Invalid field name" }, { status: 400 });
    }
    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map(col => body[col]);

    await db.execute({
      sql: `INSERT INTO ${resource} (${columns.join(", ")}) VALUES (${placeholders})`,
      args: values,
    });

    return Response.json({ ok: true, data: body });
  } catch (err: any) {
    console.error(`[api/data/${resource}] POST error:`, err);
    return Response.json({
      ok: false,
      error: err.message || "Failed to create record"
    }, { status: 500 });
  }
}

// ─── PUT - Update record ──────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const { resource } = await params;

  if (!VALID_RESOURCES.includes(resource)) {
    return Response.json({ ok: false, error: "Invalid resource" }, { status: 400 });
  }

  const actor = await resolveActor(req);
  if (!actor) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  if (!body.id) {
    return Response.json({ ok: false, error: "Missing id" }, { status: 400 });
  }

  try {
    await ensureAllTables();

    // Build UPDATE query — scoped to the caller's own records only.
    const { id, user_id: _ignoredUserId, created_at, ...updates } = body;
    const columns = sanitizeColumns(Object.keys(updates));
    if (!columns) {
      return Response.json({ ok: false, error: "Invalid field name" }, { status: 400 });
    }
    const setClause = columns.map(col => `${col} = ?`).join(", ");
    const values = [...columns.map(col => updates[col]), id, actor.userId];

    await db.execute({
      sql: `UPDATE ${resource} SET ${setClause} WHERE id = ? AND user_id = ?`,
      args: values,
    });

    return Response.json({ ok: true, data: body });
  } catch (err: any) {
    console.error(`[api/data/${resource}] PUT error:`, err);
    return Response.json({
      ok: false,
      error: err.message || "Failed to update record"
    }, { status: 500 });
  }
}

// ─── DELETE - Delete record ───────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const { resource } = await params;

  if (!VALID_RESOURCES.includes(resource)) {
    return Response.json({ ok: false, error: "Invalid resource" }, { status: 400 });
  }

  const actor = await resolveActor(req);
  if (!actor) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  if (["clients", "staff", "services", "invoices"].includes(resource) && !can(actor, "delete")) {
    return Response.json({ ok: false, error: "You don't have permission to delete." }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return Response.json({ ok: false, error: "Missing id" }, { status: 400 });
  }

  try {
    await ensureAllTables();

    await db.execute({
      sql: `DELETE FROM ${resource} WHERE id = ? AND user_id = ?`,
      args: [id, actor.userId],
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error(`[api/data/${resource}] DELETE error:`, err);
    return Response.json({ ok: false, error: "Failed to delete record" }, { status: 500 });
  }
}
