// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuestbookProvider } from "../guestbook/GuestbookProvider";
import { GuestbookSection } from "./GuestbookSection";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe("Guestbook carousel", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} })));
    vi.stubGlobal("IntersectionObserver", class {
      constructor(private callback: (entries: Array<{ isIntersecting: boolean }>) => void) {}
      observe() { this.callback([{ isIntersecting: true }]); }
      disconnect() {}
    });
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => Response.json({ success: true, data:
      Array.from({ length: 7 }, (_, index) => ({
        id: `wish-${index}`, name: `Guest ${index + 1}`, message: `Ucapan ${index + 1}`, createdAt: "2026-10-16",
      })),
    }));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  async function render() {
    await act(async () => root.render(<GuestbookProvider apiUrl="/api/wishes"><GuestbookSection /></GuestbookProvider>));
  }

  it("rotates visible wishes, limits dot count, and pauses on manual selection", async () => {
    await render();
    expect(container.querySelectorAll(".guestbook-dots button")).toHaveLength(5);
    expect(container.querySelector("blockquote")?.textContent).toBe("Ucapan 1");
    await act(async () => { vi.advanceTimersByTime(7000); });
    expect(container.querySelector("blockquote")?.textContent).toBe("Ucapan 2");
    await act(async () => { container.querySelector<HTMLButtonElement>('[aria-label="Lihat ucapan 4"]')!.click(); });
    await act(async () => { vi.advanceTimersByTime(14000); });
    expect(container.querySelector("blockquote")?.textContent).toBe("Ucapan 4");
    expect(container.querySelector('[aria-label="Mainkan pertukaran ucapan"]')).not.toBeNull();
  });

  it("does not autoplay when reduced motion is requested", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener() {}, removeEventListener() {} })));
    await render();
    await act(async () => { vi.advanceTimersByTime(21000); });
    expect(container.querySelector("blockquote")?.textContent).toBe("Ucapan 1");
    expect(container.querySelector(".guestbook-playback button")).toBeNull();
    await act(async () => { container.querySelector<HTMLButtonElement>('[aria-label="Ucapan seterusnya"]')!.click(); });
    expect(container.querySelector("blockquote")?.textContent).toBe("Ucapan 2");
  });

  it("pauses while keyboard focus is inside the carousel", async () => {
    await render();
    await act(async () => { container.querySelector<HTMLButtonElement>('[aria-label="Ucapan seterusnya"]')!.focus(); });
    await act(async () => { vi.advanceTimersByTime(14000); });
    expect(container.querySelector("blockquote")?.textContent).toBe("Ucapan 1");
  });
});
