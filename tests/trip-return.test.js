const { findReturnableTrip, validateReturn, applyReturn, today } = require("./logic");

const makeTrip = (overrides = {}) => ({
  id: "t1",
  carId: "CAR1",
  bookedByPfId: "123456",
  officerPfId: "123456",
  approvalStatus: "approved",
  returnTime: "",
  endKm: "",
  remarks: "",
  ...overrides,
});

// ── findReturnableTrip ─────────────────────────────────────────

describe("findReturnableTrip", () => {
  test("finds the user's approved active trip as booker", () => {
    const trips = [makeTrip({ bookedByPfId: "123456", officerPfId: "999" })];
    expect(findReturnableTrip("123456", trips)).not.toBeNull();
  });

  test("finds the user's approved active trip as officer", () => {
    const trips = [makeTrip({ bookedByPfId: "999", officerPfId: "123456" })];
    expect(findReturnableTrip("123456", trips)).not.toBeNull();
  });

  test("returns null when there are no trips", () => {
    expect(findReturnableTrip("123456", [])).toBeNull();
  });

  test("returns null when the trip is already returned", () => {
    const trips = [makeTrip({ returnTime: "2026-04-01 15:00" })];
    expect(findReturnableTrip("123456", trips)).toBeNull();
  });

  test("returns null when the trip is still pending (not approved)", () => {
    const trips = [makeTrip({ approvalStatus: "pending" })];
    expect(findReturnableTrip("123456", trips)).toBeNull();
  });

  test("returns null when the trip belongs to a different user", () => {
    const trips = [makeTrip({ bookedByPfId: "999999", officerPfId: "999999" })];
    expect(findReturnableTrip("123456", trips)).toBeNull();
  });

  test("returns the first active trip when user has multiple", () => {
    const trips = [
      makeTrip({ id: "t1", carId: "CAR1" }),
      makeTrip({ id: "t2", carId: "CAR2" }),
    ];
    expect(findReturnableTrip("123456", trips).id).toBe("t1");
  });
});

// ── validateReturn ─────────────────────────────────────────────

describe("validateReturn", () => {
  const approvedTrip = makeTrip({ id: "t1" });

  test("passes when tripId is explicitly provided with a return time", () => {
    expect(validateReturn({ tripId: "t1", returnTime: "15:00", userPfId: "123456", trips: [] })).toBeNull();
  });

  test("passes when tripId is auto-resolved from trips array", () => {
    expect(
      validateReturn({ tripId: "", returnTime: "15:00", userPfId: "123456", trips: [approvedTrip] })
    ).toBeNull();
  });

  test("fails when no tripId and no resolvable trip in array", () => {
    expect(
      validateReturn({ tripId: "", returnTime: "15:00", userPfId: "123456", trips: [] })
    ).toMatch(/select trip/i);
  });

  test("fails when tripId is provided but returnTime is missing", () => {
    expect(
      validateReturn({ tripId: "t1", returnTime: "", userPfId: "123456", trips: [] })
    ).toMatch(/return time/i);
  });

  test("fails when both tripId and returnTime are missing", () => {
    expect(
      validateReturn({ tripId: "", returnTime: "", userPfId: "123456", trips: [] })
    ).not.toBeNull();
  });
});

// ── applyReturn ────────────────────────────────────────────────

describe("applyReturn", () => {
  test("sets returnTime as 'date time' on the matched trip", () => {
    const trips = [makeTrip({ id: "t1" })];
    const result = applyReturn(trips, "t1", "2026-04-01", "15:30", "12500", "All good");
    expect(result[0].returnTime).toBe("2026-04-01 15:30");
  });

  test("sets endKm and remarks on the matched trip", () => {
    const trips = [makeTrip({ id: "t1" })];
    const result = applyReturn(trips, "t1", "2026-04-01", "15:30", "12500", "Smooth trip");
    expect(result[0].endKm).toBe("12500");
    expect(result[0].remarks).toBe("Smooth trip");
  });

  test("does not modify other trips in the array", () => {
    const trips = [
      makeTrip({ id: "t1" }),
      makeTrip({ id: "t2", carId: "CAR2" }),
    ];
    const result = applyReturn(trips, "t1", "2026-04-01", "15:30", "", "");
    expect(result[1].returnTime).toBe("");
  });

  test("original trips array is not mutated", () => {
    const trips = [makeTrip({ id: "t1" })];
    applyReturn(trips, "t1", "2026-04-01", "15:30", "", "");
    expect(trips[0].returnTime).toBe("");
  });

  test("handles empty endKm and remarks without errors", () => {
    const trips = [makeTrip({ id: "t1" })];
    expect(() => applyReturn(trips, "t1", "2026-04-01", "10:00", "", "")).not.toThrow();
  });

  test("returns unchanged array when tripId does not match any trip", () => {
    const trips = [makeTrip({ id: "t1" })];
    const result = applyReturn(trips, "t99", "2026-04-01", "10:00", "", "");
    expect(result[0].returnTime).toBe("");
  });
});
