import { describe, it, expect } from "vitest";
import { formatDisplayDate, formatDisplayDateTime, DISPLAY_DATE } from "@/lib/dateFormat";

describe("dateFormat", () => {
  it("exports DD-MMM-yy pattern token", () => {
    expect(DISPLAY_DATE).toBe("dd-MMM-yy");
  });

  describe("formatDisplayDate", () => {
    it("returns em dash for null/undefined/empty", () => {
      expect(formatDisplayDate(null)).toBe("—");
      expect(formatDisplayDate(undefined)).toBe("—");
      expect(formatDisplayDate("")).toBe("—");
    });

    it("formats ISO date string", () => {
      expect(formatDisplayDate("2025-01-26")).toBe("26-Jan-25");
    });

    it("formats Date instance", () => {
      expect(formatDisplayDate(new Date(2025, 0, 26))).toBe("26-Jan-25");
    });
  });

  describe("formatDisplayDateTime", () => {
    it("returns em dash for missing value", () => {
      expect(formatDisplayDateTime(null)).toBe("—");
    });

    it("includes DD-MMM-YY-style date and a time segment", () => {
      const s = formatDisplayDateTime("2025-06-15T12:00:00.000Z");
      expect(s).toMatch(/\d{2}-[A-Za-z]{3}-\d{2},\s+\d{1,2}:\d{2}\s*(AM|PM)/i);
    });
  });
});
