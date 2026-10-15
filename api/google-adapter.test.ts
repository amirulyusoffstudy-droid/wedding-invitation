import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

function createAdapter() {
  const rows: unknown[][] = [["Timestamp", "Nama", "Ucapan"]];
  const sheet = {
    getLastColumn: () => rows[0].length,
    getLastRow: () => rows.length,
    getMaxRows: () => 100,
    getMaxColumns: () => 26,
    getRange: (row: number, column: number, height = 1, width = 1) => ({
      getValues: () => Array.from({ length: height }, (_, index) =>
        Array.from({ length: width }, (_, col) => rows[row - 1 + index]?.[column - 1 + col] ?? "")),
      getDisplayValues: () => [rows[row - 1].map(String)],
      setValue: (value: unknown) => { rows[row - 1][column - 1] = value; },
      setValues: (values: unknown[][]) => { rows[row - 1] = values[0]; },
    }),
    getDataRange: () => ({ getValues: () => rows }),
  };
  const context = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheets: () => [sheet] }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => "test-secret" }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (text: string) => ({ setMimeType: () => JSON.parse(text) }),
    },
    console: { error: () => {} },
  };
  const adapter = runInNewContext(
    readFileSync("docs/google-apps-script-wishes.js", "utf8") + "\n({ doGet, doPost });",
    context,
  );
  return { rows, adapter, submit: (payload: object) => adapter.doPost({
    postData: { contents: JSON.stringify({ ...payload, writeSecret: "test-secret" }) },
  }) };
}

describe("Google Sheet RSVP adapter", () => {
  it("saves attendance and ucapan in one row and keeps attendance out of public reads", () => {
    const { rows, adapter, submit } = createAdapter();
    const result = submit({ name: "Guest", message: "Tahniah!", attendance: "attending", guestCount: 3 });
    expect(result.success).toBe(true);
    expect(result.rsvpSaved).toBe(true);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(["Timestamp", "Nama", "Ucapan", "Kehadiran", "Bilangan Tetamu"]);
    expect(rows[1].slice(1)).toEqual(["Guest", "Tahniah!", "Hadir", 3]);
    const publicData = adapter.doGet();
    expect(publicData.capabilities.rsvp).toBe(true);
    expect(publicData.data[0]).toMatchObject({ name: "Guest", message: "Tahniah!" });
    expect(publicData.data[0]).not.toHaveProperty("attendance");
    expect(publicData.data[0]).not.toHaveProperty("guestCount");
  });

  it("keeps RSVP-only rows private and neutralizes spreadsheet formulas", () => {
    const { rows, adapter, submit } = createAdapter();
    expect(submit({ name: "=formula", message: "", attendance: "not-attending", guestCount: 0 }).rsvpSaved).toBe(true);
    expect(rows[1][1]).toBe("\u200B=formula");
    expect(adapter.doGet().data).toEqual([]);
  });

  it("rejects inconsistent attendance without creating a response row", () => {
    const { rows, submit } = createAdapter();
    expect(submit({ name: "Guest", attendance: "not-attending", guestCount: 2 }).success).toBe(false);
    expect(rows).toHaveLength(1);
  });

  it("keeps existing wishes visible after many RSVP-only responses", () => {
    const { adapter, submit } = createAdapter();
    submit({ name: "Guest", message: "Tahniah!", attendance: "attending", guestCount: 1 });
    for (let index = 0; index < 51; index += 1) {
      submit({ name: `Guest ${index}`, message: "", attendance: "not-attending", guestCount: 0 });
    }
    expect(adapter.doGet().data).toHaveLength(1);
    expect(adapter.doGet().data[0].message).toBe("Tahniah!");
  });
});
