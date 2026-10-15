// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { calendarReady, downloadCalendar, googleCalendarUrl } from "./calendar";

describe("calendar utilities", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("builds a configured Google Calendar URL", () => {
    expect(calendarReady()).toBe(true);
    const url = new URL(googleCalendarUrl());
    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("ctz")).toBe("Asia/Kuala_Lumpur");
    expect(url.searchParams.get("text")).toContain("Erni & Amirul");
  });

  it("downloads an ICS invitation with the expected filename", () => {
    const createObjectUrl = vi.fn(() => "blob:wedding-calendar");
    const revokeObjectUrl = vi.fn();
    const NativeURL = URL;
    class MockURL extends NativeURL {
      static createObjectURL = createObjectUrl;
      static revokeObjectURL = revokeObjectUrl;
    }
    vi.stubGlobal("URL", MockURL);

    let downloadedFilename = "";
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloadedFilename = this.download;
    });

    expect(downloadCalendar()).toBe(true);
    expect(downloadedFilename).toBe("amirul-erni-wedding.ics");
    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:wedding-calendar");
  });
});
