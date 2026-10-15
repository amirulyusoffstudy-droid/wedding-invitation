import { describe, expect, it } from "vitest";
import { getGuestName } from "./guest";

describe("getGuestName", () => {
  it("normalizes a personalized guest name", () => {
    expect(getGuestName("?to=%20Keluarga%20%20Ahmad%20")).toBe(
      "Keluarga Ahmad",
    );
  });

  it("rejects malformed UTF-8 and removes control characters", () => {
    expect(getGuestName("?to=%E0%A4%A")).toBeNull();
    expect(getGuestName("?to=Ali%00%0AAbu")).toBe("AliAbu");
  });

  it("limits public guest names to 80 characters", () => {
    expect(getGuestName(`?to=${"a".repeat(100)}`)).toHaveLength(80);
  });
});
