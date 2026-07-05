const MAX_GUEST_LENGTH = 80;

export function getGuestName(search: string): string | null {
  try {
    const raw = new URLSearchParams(search).get("to");
    if (!raw) return null;
    // URLSearchParams replaces malformed UTF-8 with U+FFFD.
    if (raw.includes("\uFFFD")) return null;
    const safe = raw
      // Guest names must not contain invisible browser control characters.
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_GUEST_LENGTH);
    return safe || null;
  } catch {
    return null;
  }
}
