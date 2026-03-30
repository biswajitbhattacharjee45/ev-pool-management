const { applyApproval, applyRejection, ADMIN_1, ADMIN_2 } = require("./logic");

const makeTrip = (overrides = {}) => ({
  id: "t1",
  carId: "CAR1",
  officerName: "Test Officer",
  approvalStatus: "pending",
  approvedBy: [],
  rejectedBy: null,
  rejectionReason: "",
  ...overrides,
});

// ── applyApproval ──────────────────────────────────────────────

describe("applyApproval — single admin approval", () => {
  test("adds the approver's pfId to approvedBy", () => {
    const trip = makeTrip();
    const result = applyApproval(trip, ADMIN_1.pfId);
    expect(result.approvedBy).toContain(ADMIN_1.pfId);
  });

  test("status becomes approved when ADMIN_1 approves", () => {
    const trip = makeTrip();
    const result = applyApproval(trip, ADMIN_1.pfId);
    expect(result.approvalStatus).toBe("approved");
  });

  test("status becomes approved when ADMIN_2 approves", () => {
    const trip = makeTrip();
    const result = applyApproval(trip, ADMIN_2.pfId);
    expect(result.approvalStatus).toBe("approved");
  });

  test("status stays pending when a non-admin approves", () => {
    const trip = makeTrip();
    const result = applyApproval(trip, "999999");
    expect(result.approvalStatus).toBe("pending");
  });

  test("approving twice by the same admin does not duplicate the entry", () => {
    const trip = makeTrip({ approvedBy: [ADMIN_1.pfId] });
    const result = applyApproval(trip, ADMIN_1.pfId);
    const count = result.approvedBy.filter((id) => id === ADMIN_1.pfId).length;
    expect(count).toBe(1);
  });

  test("original trip object is not mutated", () => {
    const trip = makeTrip();
    applyApproval(trip, ADMIN_1.pfId);
    expect(trip.approvedBy).toEqual([]);
    expect(trip.approvalStatus).toBe("pending");
  });

  test("already-approved trip stays approved when approved again", () => {
    const trip = makeTrip({ approvalStatus: "approved", approvedBy: [ADMIN_1.pfId] });
    const result = applyApproval(trip, ADMIN_2.pfId);
    expect(result.approvalStatus).toBe("approved");
  });
});

describe("applyApproval — approvedBy initialisation", () => {
  test("handles trip with no approvedBy field gracefully", () => {
    const trip = makeTrip();
    delete trip.approvedBy;
    expect(() => applyApproval(trip, ADMIN_1.pfId)).not.toThrow();
    expect(applyApproval(trip, ADMIN_1.pfId).approvedBy).toContain(ADMIN_1.pfId);
  });
});

// ── applyRejection ─────────────────────────────────────────────

describe("applyRejection", () => {
  test("sets approvalStatus to rejected", () => {
    const trip = makeTrip();
    const result = applyRejection(trip, ADMIN_1.pfId, ADMIN_1.name, "Not authorised");
    expect(result.approvalStatus).toBe("rejected");
  });

  test("records the rejecter's pfId and name", () => {
    const trip = makeTrip();
    const result = applyRejection(trip, ADMIN_2.pfId, ADMIN_2.name, "Duplicate request");
    expect(result.rejectedBy).toBe(ADMIN_2.pfId);
    expect(result.rejectedByName).toBe(ADMIN_2.name);
  });

  test("stores the rejection reason", () => {
    const trip = makeTrip();
    const result = applyRejection(trip, ADMIN_1.pfId, ADMIN_1.name, "Vehicle reserved");
    expect(result.rejectionReason).toBe("Vehicle reserved");
  });

  test("stores an empty rejection reason when none is provided", () => {
    const trip = makeTrip();
    const result = applyRejection(trip, ADMIN_1.pfId, ADMIN_1.name, "");
    expect(result.rejectionReason).toBe("");
  });

  test("original trip object is not mutated", () => {
    const trip = makeTrip();
    applyRejection(trip, ADMIN_1.pfId, ADMIN_1.name, "reason");
    expect(trip.approvalStatus).toBe("pending");
    expect(trip.rejectedBy).toBeNull();
  });

  test("an approved trip can be rejected (status overwritten)", () => {
    const trip = makeTrip({ approvalStatus: "approved", approvedBy: [ADMIN_1.pfId] });
    const result = applyRejection(trip, ADMIN_2.pfId, ADMIN_2.name, "Recalled");
    expect(result.approvalStatus).toBe("rejected");
  });
});
