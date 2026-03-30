const {
  fuelTotalKwh,
  fuelTotalCost,
  maintenancePendingCount,
  maintenanceTotalCost,
  toggleMaintenanceStatus,
} = require("./logic");

// ── fuelTotalKwh ───────────────────────────────────────────────

describe("fuelTotalKwh", () => {
  test("returns 0 for an empty log", () => {
    expect(fuelTotalKwh([])).toBe(0);
  });

  test("sums kwh correctly across multiple sessions", () => {
    const logs = [{ kwh: "30.5" }, { kwh: "15.0" }, { kwh: "10.2" }];
    expect(fuelTotalKwh(logs)).toBe(55.7);
  });

  test("treats missing kwh field as 0 (no NaN)", () => {
    const logs = [{ kwh: "20.0" }, {}, { kwh: undefined }];
    expect(fuelTotalKwh(logs)).toBe(20.0);
    expect(isNaN(fuelTotalKwh(logs))).toBe(false);
  });

  test("treats non-numeric kwh as 0", () => {
    const logs = [{ kwh: "abc" }, { kwh: "30.0" }];
    expect(fuelTotalKwh(logs)).toBe(30.0);
  });

  test("handles a single session correctly", () => {
    expect(fuelTotalKwh([{ kwh: "40.5" }])).toBe(40.5);
  });

  test("result is a number, not a string", () => {
    expect(typeof fuelTotalKwh([{ kwh: "10" }])).toBe("number");
  });
});

// ── fuelTotalCost ──────────────────────────────────────────────

describe("fuelTotalCost", () => {
  test("returns 0 for an empty log", () => {
    expect(fuelTotalCost([])).toBe(0);
  });

  test("sums chargingCost correctly", () => {
    const logs = [{ chargingCost: "245" }, { chargingCost: "130" }, { chargingCost: "75" }];
    expect(fuelTotalCost(logs)).toBe(450);
  });

  test("treats missing chargingCost as 0 (no NaN)", () => {
    const logs = [{ chargingCost: "200" }, {}];
    expect(fuelTotalCost(logs)).toBe(200);
    expect(isNaN(fuelTotalCost(logs))).toBe(false);
  });

  test("treats non-numeric chargingCost as 0", () => {
    const logs = [{ chargingCost: "N/A" }, { chargingCost: "500" }];
    expect(fuelTotalCost(logs)).toBe(500);
  });

  test("result is an integer (toFixed(0) + parseInt)", () => {
    const logs = [{ chargingCost: "100.7" }, { chargingCost: "50.2" }];
    expect(Number.isInteger(fuelTotalCost(logs))).toBe(true);
  });
});

// ── maintenancePendingCount ────────────────────────────────────

describe("maintenancePendingCount", () => {
  test("returns 0 for an empty list", () => {
    expect(maintenancePendingCount([])).toBe(0);
  });

  test("counts only Pending records", () => {
    const records = [
      { status: "Pending" },
      { status: "Completed" },
      { status: "Pending" },
    ];
    expect(maintenancePendingCount(records)).toBe(2);
  });

  test("returns 0 when all are Completed", () => {
    const records = [{ status: "Completed" }, { status: "Completed" }];
    expect(maintenancePendingCount(records)).toBe(0);
  });

  test("returns full count when all are Pending", () => {
    const records = [{ status: "Pending" }, { status: "Pending" }, { status: "Pending" }];
    expect(maintenancePendingCount(records)).toBe(3);
  });
});

// ── maintenanceTotalCost ───────────────────────────────────────

describe("maintenanceTotalCost", () => {
  test("returns 0 for an empty list", () => {
    expect(maintenanceTotalCost([])).toBe(0);
  });

  test("sums cost correctly across all records", () => {
    const records = [{ cost: "5000" }, { cost: "1200" }, { cost: "800" }];
    expect(maintenanceTotalCost(records)).toBe(7000);
  });

  test("treats missing cost as 0 (no NaN)", () => {
    const records = [{ cost: "3000" }, {}];
    expect(maintenanceTotalCost(records)).toBe(3000);
    expect(isNaN(maintenanceTotalCost(records))).toBe(false);
  });

  test("includes both Pending and Completed records in total", () => {
    const records = [
      { cost: "2000", status: "Completed" },
      { cost: "1500", status: "Pending" },
    ];
    expect(maintenanceTotalCost(records)).toBe(3500);
  });

  test("handles decimal costs correctly", () => {
    const records = [{ cost: "1500.50" }, { cost: "499.50" }];
    expect(maintenanceTotalCost(records)).toBe(2000);
  });
});

// ── toggleMaintenanceStatus ────────────────────────────────────

describe("toggleMaintenanceStatus", () => {
  test("toggles Pending → Completed for the target record", () => {
    const records = [{ id: "m1", status: "Pending" }];
    const result = toggleMaintenanceStatus(records, "m1");
    expect(result[0].status).toBe("Completed");
  });

  test("toggles Completed → Pending for the target record", () => {
    const records = [{ id: "m1", status: "Completed" }];
    const result = toggleMaintenanceStatus(records, "m1");
    expect(result[0].status).toBe("Pending");
  });

  test("does not affect other records", () => {
    const records = [
      { id: "m1", status: "Pending" },
      { id: "m2", status: "Pending" },
    ];
    const result = toggleMaintenanceStatus(records, "m1");
    expect(result[1].status).toBe("Pending");
  });

  test("returns a new array without mutating the original", () => {
    const records = [{ id: "m1", status: "Pending" }];
    const result = toggleMaintenanceStatus(records, "m1");
    expect(records[0].status).toBe("Pending");   // original unchanged
    expect(result).not.toBe(records);             // new array reference
  });

  test("returns unchanged list when id does not match", () => {
    const records = [{ id: "m1", status: "Pending" }];
    const result = toggleMaintenanceStatus(records, "m99");
    expect(result[0].status).toBe("Pending");
  });
});
