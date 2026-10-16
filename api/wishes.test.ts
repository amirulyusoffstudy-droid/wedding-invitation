import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function request(body: Record<string, unknown>) {
  const { default: handler } = await import("./wishes");
  return handler.fetch(new Request("https://example.test/api/wishes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }));
}

describe("combined RSVP API", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("WISHES_STORAGE_MODE", "google");
    vi.stubEnv("GOOGLE_WISHES_SCRIPT_URL", "https://script.google.com/macros/s/test/exec");
    vi.stubEnv("GOOGLE_WISHES_WRITE_SECRET", "test-only-secret");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it.each([
    { attendance: "maybe", guestCount: 1 },
    { attendance: "attending", guestCount: 0 },
    { attendance: "attending", guestCount: 4 },
    { attendance: "attending", guestCount: 6 },
    { attendance: "attending", guestCount: 1.5 },
    { attendance: "attending", guestCount: "2" },
    { attendance: "not-attending", guestCount: 2 },
  ])("rejects invalid attendance/count before contacting storage: %j", async (rsvp) => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await request({ name: "Guest", message: "Best wishes", ...rsvp });
    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not write when the existing adapter cannot store RSVPs", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, data: [] }),
    );
    const response = await request({ name: "Guest", attendance: "attending", guestCount: 2 });
    expect(response.status).toBe(502);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("sends attendance and wish together, but strips private fields from the response", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ success: true, capabilities: { rsvp: true } }))
      .mockResolvedValueOnce(Response.json({ success: true, rsvpSaved: true, data: {
        id: "wish-2", name: "Guest", message: "Best wishes", createdAt: "2026-10-15",
        attendance: "attending", guestCount: 2,
      } }));
    const response = await request({ name: "Guest", message: "Best wishes", attendance: "attending", guestCount: 2 });
    const result = await response.json();
    expect(response.status).toBe(201);
    expect(result.rsvpSaved).toBe(true);
    expect(result.data).not.toHaveProperty("attendance");
    expect(result.data).not.toHaveProperty("guestCount");
    expect(JSON.parse(String(fetchSpy.mock.calls[1][1]?.body))).toMatchObject({
      name: "Guest", message: "Best wishes", attendance: "attending", guestCount: 2,
    });
  });

  it("accepts a decline without publishing an empty wish", async () => {
    vi.stubEnv("WISHES_STORAGE_MODE", "mock");
    const response = await request({ name: "Guest", message: "", attendance: "not-attending", guestCount: 0 });
    const result = await response.json();
    expect(response.status).toBe(201);
    expect(result).toEqual({ success: true, rsvpSaved: true });
    const { default: handler } = await import("./wishes");
    const wall = await handler.fetch(new Request("https://example.test/api/wishes"));
    expect(JSON.stringify(await wall.json())).not.toContain('"name":"Guest"');
  });

  it("never confirms RSVP if storage did not acknowledge saving attendance", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ success: true, capabilities: { rsvp: true } }))
      .mockResolvedValueOnce(Response.json({ success: true, data: {
        id: "wish-2", name: "Guest", message: "Best wishes", createdAt: "2026-10-15",
      } }));
    const response = await request({ name: "Guest", message: "Best wishes", attendance: "attending", guestCount: 1 });
    expect(response.status).toBe(502);
  });
});
