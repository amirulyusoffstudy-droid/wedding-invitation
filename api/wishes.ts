const GOOGLE_SCRIPT_URL = process.env.GOOGLE_WISHES_SCRIPT_URL;
const MAX_NAME_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 500;
const MAX_RELATIONSHIP_LENGTH = 80;
const MAX_PUBLIC_WISHES = 50;

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
  error?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(body: unknown, status = 200, cacheControl = "no-store") {
  return Response.json(body, {
    status,
    headers: { ...corsHeaders, "Cache-Control": cacheControl },
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
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = cleanSingleLine(record.id);
  const name = cleanSingleLine(record.name).slice(0, MAX_NAME_LENGTH);
  const message = cleanMessage(record.message).slice(0, MAX_MESSAGE_LENGTH);
  const relationship = cleanSingleLine(record.relationship).slice(0, MAX_RELATIONSHIP_LENGTH);
  const createdAt = cleanSingleLine(record.createdAt);
  if (!id || !name || !message) return null;
  return { id, name, message, relationship: relationship || undefined, createdAt };
}

async function requestGoogleScript(init?: RequestInit) {
  if (!GOOGLE_SCRIPT_URL) throw new Error("Guestbook is not configured");
  const response = await fetch(GOOGLE_SCRIPT_URL, {
    redirect: "follow",
    signal: AbortSignal.timeout(10_000),
    ...init,
  });
  if (!response.ok) throw new Error(`Google Apps Script returned ${response.status}`);
  return await response.json() as UpstreamResponse;
}

async function listWishes() {
  try {
    const upstream = await requestGoogleScript();
    if (!upstream.success || !Array.isArray(upstream.data)) throw new Error(upstream.error || "Invalid response");
    const wishes = upstream.data
      .map(normalizeWish)
      .filter((wish): wish is Wish => wish !== null)
      .slice(0, MAX_PUBLIC_WISHES);
    return jsonResponse(
      { success: true, data: wishes },
      200,
    );
  } catch {
    return jsonResponse({ success: false, error: "Ucapan belum dapat dimuatkan." }, 502);
  }
}

async function createWish(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (cleanSingleLine(body.website)) {
      return jsonResponse({ success: true, data: { id: "accepted", name: "Tetamu", message: "Diterima", createdAt: new Date().toISOString() } });
    }

    const name = cleanSingleLine(body.name);
    const message = cleanMessage(body.message);
    const relationship = cleanSingleLine(body.relationship);
    if (!name || !message) return jsonResponse({ success: false, error: "Nama dan ucapan diperlukan." }, 400);
    if (name.length > MAX_NAME_LENGTH || message.length > MAX_MESSAGE_LENGTH || relationship.length > MAX_RELATIONSHIP_LENGTH) {
      return jsonResponse({ success: false, error: "Ucapan melebihi had aksara." }, 400);
    }

    const upstream = await requestGoogleScript({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, message, relationship }),
    });
    const wish = normalizeWish(upstream.data);
    if (!upstream.success || !wish) throw new Error(upstream.error || "Invalid response");
    return jsonResponse({ success: true, data: wish }, 201);
  } catch {
    return jsonResponse({ success: false, error: "Ucapan tidak dapat dihantar." }, 502);
  }
}

export default {
  async fetch(request: Request) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method === "GET") return listWishes();
    if (request.method === "POST") return createWish(request);
    return jsonResponse({ success: false, error: "Kaedah tidak disokong." }, 405);
  },
};
