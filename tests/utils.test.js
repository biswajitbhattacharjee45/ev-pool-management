const { fmtDate, fmtTime, today, now } = require("./logic");

// ── fmtDate ────────────────────────────────────────────────────

describe("fmtDate", () => {
  test("formats a valid ISO date string to Indian locale (DD-MMM-YYYY)", () => {
    const result = fmtDate("2026-04-01");
    // en-IN locale with these options produces e.g. "01 Apr 2026"
    expect(result).toMatch(/\d{2}\s[A-Za-z]{3}\s\d{4}/);
    expect(result).toContain("2026");
    expect(result).toMatch(/Apr/i);
  });

  test("returns '—' for null", () => {
    expect(fmtDate(null)).toBe("—");
  });

  test("returns '—' for undefined", () => {
    expect(fmtDate(undefined)).toBe("—");
  });

  test("returns '—' for empty string", () => {
    expect(fmtDate("")).toBe("—");
  });

  test("handles different months correctly", () => {
    expect(fmtDate("2026-01-15")).toMatch(/Jan/i);
    expect(fmtDate("2026-12-25")).toMatch(/Dec/i);
  });

  test("includes the day with leading zero", () => {
    const result = fmtDate("2026-04-05");
    expect(result).toMatch(/05/);
  });
});

// ── fmtTime ────────────────────────────────────────────────────

describe("fmtTime", () => {
  test("returns the time string as-is when provided", () => {
    expect(fmtTime("09:30")).toBe("09:30");
    expect(fmtTime("14:00")).toBe("14:00");
    expect(fmtTime("00:00")).toBe("00:00");
  });

  test("returns '—' for null", () => {
    expect(fmtTime(null)).toBe("—");
  });

  test("returns '—' for undefined", () => {
    expect(fmtTime(undefined)).toBe("—");
  });

  test("returns '—' for empty string", () => {
    expect(fmtTime("")).toBe("—");
  });

  test("returns '—' for 0 (falsy number)", () => {
    expect(fmtTime(0)).toBe("—");
  });
});

// ── today ──────────────────────────────────────────────────────

describe("today", () => {
  test("returns a string in YYYY-MM-DD format", () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("matches the current date", () => {
    const expected = new Date().toISOString().slice(0, 10);
    expect(today()).toBe(expected);
  });

  test("returns exactly 10 characters", () => {
    expect(today().length).toBe(10);
  });
});

// ── now ────────────────────────────────────────────────────────

describe("now", () => {
  test("returns a string in HH:mm format", () => {
    expect(now()).toMatch(/^\d{2}:\d{2}$/);
  });

  test("returns exactly 5 characters", () => {
    expect(now().length).toBe(5);
  });

  test("hours are between 00 and 23", () => {
    const hours = parseInt(now().split(":")[0], 10);
    expect(hours).toBeGreaterThanOrEqual(0);
    expect(hours).toBeLessThanOrEqual(23);
  });

  test("minutes are between 00 and 59", () => {
    const minutes = parseInt(now().split(":")[1], 10);
    expect(minutes).toBeGreaterThanOrEqual(0);
    expect(minutes).toBeLessThanOrEqual(59);
  });
});
