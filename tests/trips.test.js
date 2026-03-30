const { activeTripForCar, isCarBusy, userHasActiveTrip, validateBooking } = require("./logic");

// ── Fixtures ───────────────────────────────────────────────────

const makeTrip = (overrides = {}) => ({
  id: "t1",
  carId: "CAR1",
  officerPfId: "123456",
  bookedByPfId: "123456",
  destination: "Airport",
  date: "2026-04-01",
  departureTime: "09:00",
  approvalStatus: "approved",
  approvedBy: ["360664"],
  returnTime: "",
  ...overrides,
});

const CARS = [{ id: "CAR1", name: "Vehicle 1", plate: "AS 01 FF 9417" }];

// ── activeTripForCar ───────────────────────────────────────────

describe("activeTripForCar", () => {
  test("returns the active approved trip for a busy car", () => {
    const trips = [makeTrip()];
    const result = activeTripForCar("CAR1", trips);
    expect(result).toBeDefined();
    expect(result.carId).toBe("CAR1");
  });

  test("returns undefined when car has no trips at all", () => {
    expect(activeTripForCar("CAR1", [])).toBeUndefined();
  });

  test("returns undefined when trip is approved but already returned", () => {
    const trips = [makeTrip({ returnTime: "2026-04-01 15:00" })];
    expect(activeTripForCar("CAR1", trips)).toBeUndefined();
  });

  test("returns undefined when trip is pending (not yet approved)", () => {
    const trips = [makeTrip({ approvalStatus: "pending", approvedBy: [] })];
    expect(activeTripForCar("CAR1", trips)).toBeUndefined();
  });

  test("returns undefined when trip is rejected", () => {
    const trips = [makeTrip({ approvalStatus: "rejected" })];
    expect(activeTripForCar("CAR1", trips)).toBeUndefined();
  });

  test("ignores active trips for other cars", () => {
    const trips = [makeTrip({ carId: "CAR2" })];
    expect(activeTripForCar("CAR1", trips)).toBeUndefined();
  });

  test("returns active trip when car has both returned and active trips", () => {
    const trips = [
      makeTrip({ id: "t1", returnTime: "2026-04-01 12:00" }), // returned
      makeTrip({ id: "t2" }),                                  // still active
    ];
    const result = activeTripForCar("CAR1", trips);
    expect(result.id).toBe("t2");
  });
});

// ── isCarBusy ──────────────────────────────────────────────────

describe("isCarBusy", () => {
  test("returns true for a car with an active approved trip", () => {
    expect(isCarBusy("CAR1", [makeTrip()])).toBe(true);
  });

  test("returns false for a car with no trips", () => {
    expect(isCarBusy("CAR1", [])).toBe(false);
  });

  test("returns false when the only trip has been returned", () => {
    const trips = [makeTrip({ returnTime: "2026-04-01 15:00" })];
    expect(isCarBusy("CAR1", trips)).toBe(false);
  });

  test("returns false when trip is still pending approval", () => {
    const trips = [makeTrip({ approvalStatus: "pending", approvedBy: [] })];
    expect(isCarBusy("CAR1", trips)).toBe(false);
  });

  test("returns false for a different car's active trip", () => {
    const trips = [makeTrip({ carId: "CAR3" })];
    expect(isCarBusy("CAR1", trips)).toBe(false);
  });
});

// ── userHasActiveTrip ──────────────────────────────────────────

describe("userHasActiveTrip", () => {
  test("returns true when user has an approved active trip as officer", () => {
    const trips = [makeTrip({ officerPfId: "123456", bookedByPfId: "999999" })];
    expect(userHasActiveTrip("123456", trips)).toBe(true);
  });

  test("returns true when user has an approved active trip as booker", () => {
    const trips = [makeTrip({ officerPfId: "999999", bookedByPfId: "123456" })];
    expect(userHasActiveTrip("123456", trips)).toBe(true);
  });

  test("returns true when user has a pending trip", () => {
    const trips = [makeTrip({ approvalStatus: "pending", bookedByPfId: "123456" })];
    expect(userHasActiveTrip("123456", trips)).toBe(true);
  });

  test("returns false when user's trip has been returned", () => {
    const trips = [makeTrip({ bookedByPfId: "123456", returnTime: "2026-04-01 18:00" })];
    expect(userHasActiveTrip("123456", trips)).toBe(false);
  });

  test("returns false when user's trip is rejected", () => {
    const trips = [makeTrip({ bookedByPfId: "123456", approvalStatus: "rejected" })];
    expect(userHasActiveTrip("123456", trips)).toBe(false);
  });

  test("returns false when user has no trips at all", () => {
    expect(userHasActiveTrip("123456", [])).toBe(false);
  });

  test("returns false when another user has an active trip (not this user)", () => {
    const trips = [makeTrip({ bookedByPfId: "999999", officerPfId: "999999" })];
    expect(userHasActiveTrip("123456", trips)).toBe(false);
  });

  test("admin is always exempt — returns false even with active trips present", () => {
    const trips = [makeTrip({ bookedByPfId: "360664", officerPfId: "360664" })];
    expect(userHasActiveTrip("360664", trips, true)).toBe(false);
  });
});

// ── validateBooking ────────────────────────────────────────────

describe("validateBooking", () => {
  const baseArgs = {
    matchedUser: { pfId: "123456", name: "Test User" },
    carId: "CAR1",
    destination: "City Center",
    date: "2026-04-01",
    departureTime: "10:00",
    trips: [],
    cars: CARS,
    userPfId: "123456",
    isAdmin: false,
  };

  test("returns null for a fully valid booking request", () => {
    expect(validateBooking(baseArgs)).toBeNull();
  });

  test("fails when matchedUser is null (invalid PF ID)", () => {
    expect(validateBooking({ ...baseArgs, matchedUser: null })).toMatch(/valid PF ID/i);
  });

  test("fails when car is not selected", () => {
    expect(validateBooking({ ...baseArgs, carId: "" })).toMatch(/required fields/i);
  });

  test("fails when destination is empty", () => {
    expect(validateBooking({ ...baseArgs, destination: "" })).toMatch(/required fields/i);
  });

  test("fails when date is empty", () => {
    expect(validateBooking({ ...baseArgs, date: "" })).toMatch(/required fields/i);
  });

  test("fails when departure time is empty", () => {
    expect(validateBooking({ ...baseArgs, departureTime: "" })).toMatch(/required fields/i);
  });

  test("fails when selected car is already on duty", () => {
    const activeTrip = makeTrip({ carId: "CAR1" });
    expect(validateBooking({ ...baseArgs, trips: [activeTrip] })).toMatch(/on duty/i);
  });

  test("fails when user already has an active trip", () => {
    const myTrip = makeTrip({ carId: "CAR2", bookedByPfId: "123456" });
    expect(validateBooking({ ...baseArgs, trips: [myTrip] })).toMatch(/active\/pending trip/i);
  });

  test("admin can book even if they have an active trip", () => {
    const myTrip = makeTrip({ carId: "CAR2", bookedByPfId: "360664" });
    expect(
      validateBooking({ ...baseArgs, trips: [myTrip], userPfId: "360664", isAdmin: true })
    ).toBeNull();
  });
});
