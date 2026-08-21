const GOOGLE_SCRIPT_URL = process.env.GOOGLE_WISHES_SCRIPT_URL;
const GOOGLE_WRITE_SECRET = process.env.GOOGLE_WISHES_WRITE_SECRET;
const IS_LOCAL_DEVELOPMENT = process.env.VERCEL_ENV === "development"
  || process.env.NODE_ENV === "development";
const STORAGE_MODE = IS_LOCAL_DEVELOPMENT ? "mock" : process.env.WISHES_STORAGE_MODE || "google";
const MAX_NAME_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 500;
const MAX_RELATIONSHIP_LENGTH = 80;
const MAX_PUBLIC_WISHES = 50;
const MAX_REQUEST_BYTES = 4_096;
const DEFAULT_ALLOWED_ORIGINS = [
  "https://erni-amirul.vercel.app",
  "https://amirulyusoffstudy-droid.github.io",
];
const LOCAL_ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

interface Wish {
  id: string;
  name: string;
  message: string;
  relationship?: string;
  createdAt: string;
}

interface UpstreamResponse {
  success?: boolean;
  data?: unknown;
}

class PublicApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const allowedOrigins = new Set(
  (process.env.WISHES_ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const vercelDeploymentHost = process.env.VERCEL_URL?.trim().toLowerCase();
if (vercelDeploymentHost && /^[a-z0-9.-]+\.vercel\.app$/.test(vercelDeploymentHost)) {
  allowedOrigins.add(`https://${vercelDeploymentHost}`);
}
if (IS_LOCAL_DEVELOPMENT) LOCAL_ALLOWED_ORIGINS.forEach((origin) => allowedOrigins.add(origin));

let mockWishes: Wish[] = [
  {
    id: "mock-wish-1",
    name: "Tetamu Contoh",
    message: "Semoga majlis dipermudahkan dan rumah tangga sentiasa diberkati.",
    createdAt: "2026-08-21T00:00:00.000Z",
  },
];

function isOriginAllowed(request: Request) {
  const origin = request.headers.get("Origin");
  return !origin || allowedOrigins.has(origin);
}

function responseHeaders(request: Request, cacheControl = "no-store") {
  const headers = new Headers({
    "Cache-Control": cacheControl,
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
  });
  const origin = request.headers.get("Origin");
  if (origin && allowedOrigins.has(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

function jsonResponse(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(request),
  });
}

function cleanSingleLine(value: unknown) {
  return typeof value === "string"
    // Public input must not retain browser control characters.
    // eslint-disable-next-line no-control-regex
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim()
    : "";
}

function cleanMessage(value: unknown) {
  return typeof value === "string"
    // Preserve line breaks while removing the remaining control characters.
    // eslint-disable-next-line no-control-regex
    ? value.replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g, "").trim()
    : "";
}

function normalizeWish(value: unknown): Wish | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const id = cleanSingleLine(record.id).slice(0, 100);
  const name = cleanSingleLine(record.name).slice(0, MAX_NAME_LENGTH);
  const message = cleanMessage(record.message).slice(0, MAX_MESSAGE_LENGTH);
  const relationship = cleanSingleLine(record.relationship).slice(0, MAX_RELATIONSHIP_LENGTH);
  const createdAt = cleanSingleLine(record.createdAt).slice(0, 64);
  if (!id || !name || !message) return null;
  return { id, name, message, relationship: relationship || undefined, createdAt };
}

function getGoogleScriptUrl() {
  if (!GOOGLE_SCRIPT_URL) throw new Error("Guestbook is not configured");
  const url = new URL(GOOGLE_SCRIPT_URL);
  if (url.protocol !== "https:" || url.hostname !== "script.google.com"
    || !/^\/macros\/s\/[^/]+\/exec$/.test(url.pathname)) {
    throw new Error("Guestbook upstream is invalid");
  }
  return url;
}

async function requestGoogleScript(init?: RequestInit) {
  const response = await fetch(getGoogleScriptUrl(), {
    redirect: "follow",
    signal: AbortSignal.timeout(10_000),
    ...init,
  });
  if (!response.ok) throw new Error(`Google Apps Script returned ${response.status}`);
  return await response.json() as UpstreamResponse;
}

async function parseJsonBody(request: Request) {
  const contentType = request.headers.get("Content-Type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new PublicApiError(415, "Gunakan format JSON.");
  }

  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    throw new PublicApiError(413, "Permintaan terlalu besar.");
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
    throw new PublicApiError(413, "Permintaan terlalu besar.");
  }

  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("JSON object required");
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new PublicApiError(400, "Format permintaan tidak sah.");
  }
}

async function listWishes(request: Request) {
  try {
    if (STORAGE_MODE === "mock") {
      return jsonResponse(request, { success: true, data: mockWishes.slice(0, MAX_PUBLIC_WISHES) });
    }
    const upstream = await requestGoogleScript();
    if (!upstream.success || !Array.isArray(upstream.data)) throw new Error("Invalid response");
    const wishes = upstream.data
      .map(normalizeWish)
      .filter((wish): wish is Wish => wish !== null)
      .slice(0, MAX_PUBLIC_WISHES);
    return jsonResponse(request, { success: true, data: wishes });
  } catch {
    return jsonResponse(request, { success: false, error: "Ucapan belum dapat dimuatkan." }, 502);
  }
}

async function createWish(request: Request) {
  try {
    const body = await parseJsonBody(request);
    if (cleanSingleLine(body.website)) {
      return jsonResponse(request, {
        success: true,
        data: { id: "accepted", name: "Tetamu", message: "Diterima", createdAt: new Date().toISOString() },
      });
    }

    const name = cleanSingleLine(body.name);
    const message = cleanMessage(body.message);
    const relationship = cleanSingleLine(body.relationship);
    if (!name || !message) throw new PublicApiError(400, "Nama dan ucapan diperlukan.");
    if (name.length > MAX_NAME_LENGTH || message.length > MAX_MESSAGE_LENGTH
      || relationship.length > MAX_RELATIONSHIP_LENGTH) {
      throw new PublicApiError(400, "Ucapan melebihi had aksara.");
    }

    if (STORAGE_MODE === "mock") {
      const wish: Wish = {
        id: `mock-wish-${crypto.randomUUID()}`,
        name,
        message,
        relationship: relationship || undefined,
        createdAt: new Date().toISOString(),
      };
      mockWishes = [wish, ...mockWishes].slice(0, MAX_PUBLIC_WISHES);
      return jsonResponse(request, { success: true, data: wish }, 201);
    }

    if (!GOOGLE_WRITE_SECRET) throw new Error("Guestbook write secret is not configured");
    const upstream = await requestGoogleScript({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, message, relationship, writeSecret: GOOGLE_WRITE_SECRET }),
    });
    const wish = normalizeWish(upstream.data);
    if (!upstream.success || !wish) throw new Error("Invalid response");
    return jsonResponse(request, { success: true, data: wish }, 201);
  } catch (error) {
    if (error instanceof PublicApiError) {
      return jsonResponse(request, { success: false, error: error.message }, error.status);
    }
    return jsonResponse(request, { success: false, error: "Ucapan tidak dapat dihantar." }, 502);
  }
}

function preflightResponse(request: Request) {
  if (!isOriginAllowed(request)) {
    return jsonResponse(request, { success: false, error: "Origin tidak dibenarkan." }, 403);
  }
  const headers = responseHeaders(request);
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Max-Age", "600");
  return new Response(null, { status: 204, headers });
}

export default {
  async fetch(request: Request) {
    if (request.method === "OPTIONS") return preflightResponse(request);
    if (!isOriginAllowed(request)) {
      return jsonResponse(request, { success: false, error: "Origin tidak dibenarkan." }, 403);
    }
    if (request.method === "GET") return listWishes(request);
    if (request.method === "POST") return createWish(request);
    return jsonResponse(request, { success: false, error: "Kaedah tidak disokong." }, 405);
  },
};
