// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WishesPanel } from "./WishesPanel";

const testGlobal = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};
testGlobal.IS_REACT_ACT_ENVIRONMENT = true;

describe("WishesPanel", () => {
  const containers: HTMLDivElement[] = [];

  afterEach(() => {
    containers.splice(0).forEach((container) => container.remove());
    vi.restoreAllMocks();
  });

  it("focuses the first invalid field and shows its inline error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const container = document.createElement("div");
    document.body.append(container);
    containers.push(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <WishesPanel apiUrl="/api/wishes" message="Titipkan ucapan." />,
      );
    });
    await act(async () => Promise.resolve());

    const form = container.querySelector("form");
    await act(async () => {
      form?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    await act(
      async () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );

    expect(document.activeElement?.getAttribute("name")).toBe("name");
    expect(container.querySelector(".field-error")?.textContent).toBe(
      "Masukkan nama anda.",
    );

    await act(async () => root.unmount());
  });

  it("submits attendance and ucapan once and displays the returned wish", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ success: true, data: [] }))
      .mockResolvedValueOnce(Response.json({ success: true, rsvpSaved: true, data: {
        id: "wish-new", name: "Guest", message: "Selamat pengantin baru!", createdAt: "2026-10-15",
      } }));
    const container = document.createElement("div");
    document.body.append(container);
    containers.push(container);
    const root = createRoot(container);
    await act(async () => root.render(<WishesPanel apiUrl="/api/wishes" message="RSVP" />));

    const setValue = async (selector: string, value: string) => {
      const element = container.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector)!;
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value")!.set!;
      await act(async () => {
        setter.call(element, value);
        element.dispatchEvent(new Event(element.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
      });
    };
    await setValue('[name="name"]', "Guest");
    await setValue('[name="attendance"]', "attending");
    await setValue('[name="guestCount"]', "3");
    await setValue('[name="message"]', "Selamat pengantin baru!");
    await act(async () => {
      container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchSpy.mock.calls[1][1]?.body))).toMatchObject({
      name: "Guest", attendance: "attending", guestCount: 3, message: "Selamat pengantin baru!",
    });
    expect(container.querySelector(".wish-card")?.textContent).toContain("Selamat pengantin baru!");
    expect(container.querySelector(".is-success")?.textContent).toContain("RSVP berjaya disimpan");
    expect(container.querySelector(".wish-wall")?.textContent).not.toContain("guestCount");
    await act(async () => root.unmount());
  });

  it("records a decline with zero guests and allows an empty wish", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ success: true, data: [] }))
      .mockResolvedValueOnce(Response.json({ success: true, rsvpSaved: true }));
    const container = document.createElement("div");
    document.body.append(container);
    containers.push(container);
    const root = createRoot(container);
    await act(async () => root.render(<WishesPanel apiUrl="/api/wishes" message="RSVP" />));
    await act(async () => {
      const name = container.querySelector<HTMLInputElement>('[name="name"]')!;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(name, "Guest");
      name.dispatchEvent(new Event("input", { bubbles: true }));
      const attendance = container.querySelector<HTMLSelectElement>('[name="attendance"]')!;
      attendance.value = "not-attending";
      attendance.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(container.querySelector('[name="guestCount"]')).toBeNull();
    await act(async () => {
      container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(JSON.parse(String(fetchSpy.mock.calls[1][1]?.body))).toMatchObject({
      attendance: "not-attending", guestCount: 0, message: "",
    });
    expect(container.querySelector(".is-success")).not.toBeNull();
    expect(container.querySelector(".wish-card")).toBeNull();
    await act(async () => root.unmount());
  });
});
