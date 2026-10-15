// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const testGlobal = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};
testGlobal.IS_REACT_ACT_ENVIRONMENT = true;
const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

describe("App invitation opening", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    container = document.createElement("div");
    document.body.append(container);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    container.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: originalScrollIntoView,
    });
  });

  it("moves focus to the invitation after the cover opens", async () => {
    const root = createRoot(container);
    await act(async () => root.render(<App />));

    const openButton = [...container.querySelectorAll("button")].find(
      (button) => button.textContent?.includes("Buka Jemputan"),
    );
    await act(async () => {
      openButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      vi.advanceTimersByTime(420);
    });

    expect(document.activeElement?.id).toBe("jemputan");
    expect(sessionStorage.getItem("invitation-opened")).toBe("true");

    await act(async () => root.unmount());
  });
});
