import { wedding } from "../data/wedding";

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function localStamp(date: string, time: string) {
  return `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;
}

export function calendarReady() {
  return /^\d{2}:\d{2}$/.test(wedding.event.startTime) && /^\d{2}:\d{2}$/.test(wedding.event.endTime);
}

export function downloadCalendar() {
  if (!calendarReady()) return false;
  const date = "2026-12-26";
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Erni & Amirul//Wedding Invitation//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:amirul-erni-20261226@amirul-erni.vercel.app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART;TZID=Asia/Kuala_Lumpur:${localStamp(date, wedding.event.startTime)}`,
    `DTEND;TZID=Asia/Kuala_Lumpur:${localStamp(date, wedding.event.endTime)}`,
    `SUMMARY:${escapeIcs(wedding.event.title)}`,
    `LOCATION:${escapeIcs(`${wedding.event.venue}, ${wedding.event.address}`)}`,
    `DESCRIPTION:${escapeIcs(wedding.event.description)}`,
    "END:VEVENT", "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "amirul-erni-wedding.ics";
  anchor.click();
  URL.revokeObjectURL(url);
  return true;
}

export function googleCalendarUrl() {
  if (!calendarReady()) return "";
  const date = "2026-12-26";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: wedding.event.title,
    dates: `${localStamp(date, wedding.event.startTime)}/${localStamp(date, wedding.event.endTime)}`,
    ctz: "Asia/Kuala_Lumpur",
    details: wedding.event.description,
    location: `${wedding.event.venue}, ${wedding.event.address}`,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
