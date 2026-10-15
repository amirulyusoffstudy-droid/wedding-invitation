export type Attendance = "attending" | "not-attending";

export interface Rsvp {
  attendance: Attendance;
  guestCount: number;
}

export const MAX_GUEST_COUNT = 5;

export function isValidRsvp(value: unknown): value is Rsvp {
  if (!value || typeof value !== "object") return false;
  const rsvp = value as Record<string, unknown>;
  if (rsvp.attendance === "not-attending") return rsvp.guestCount === 0;
  return rsvp.attendance === "attending"
    && typeof rsvp.guestCount === "number"
    && Number.isInteger(rsvp.guestCount)
    && rsvp.guestCount >= 1
    && rsvp.guestCount <= MAX_GUEST_COUNT;
}
