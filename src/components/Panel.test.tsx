// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Panel } from "./Panel";

const testGlobal = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};
testGlobal.IS_REACT_ACT_ENVIRONMENT = true;

describe("Panel", () => {
  const containers: HTMLDivElement[] = [];

  afterEach(() => {
    containers.splice(0).forEach((container) => container.remove());
    document.body.style.overflow = "";
    vi.restoreAllMocks();
  });

  it("moves focus inside, closes on Escape, and restores document scrolling", async () => {
    const opener = document.createElement("button");
    const container = document.createElement("div");
    document.body.append(opener, container);
    containers.push(container);
    opener.focus();
    const close = vi.fn();
    const root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(Panel, { title: "Ucapan", close, children: "Kandungan" }),
      );
    });

    expect(document.activeElement?.getAttribute("aria-label")).toBe(
      "Tutup Ucapan",
    );
    expect(document.body.style.overflow).toBe("hidden");

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(close).toHaveBeenCalledOnce();

    await act(async () => root.unmount());
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
