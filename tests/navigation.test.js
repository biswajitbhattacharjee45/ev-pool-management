const { buildNavItems } = require("./logic");

const ids = (items) => items.map((i) => i.id);

// ── Base tabs (all roles) ──────────────────────────────────────

describe("buildNavItems — base tabs present for all users", () => {
  const roles = [
    { label: "plain staff",  user: { isAdmin: false, isAssistant: false } },
    { label: "assistant",    user: { isAdmin: false, isAssistant: true  } },
    { label: "admin",        user: { isAdmin: true,  isAssistant: false } },
  ];

  roles.forEach(({ label, user }) => {
    test(`${label} sees dashboard, book, and trips tabs`, () => {
      const nav = ids(buildNavItems(user));
      expect(nav).toContain("dashboard");
      expect(nav).toContain("book");
      expect(nav).toContain("trips");
    });
  });
});

// ── Plain staff ────────────────────────────────────────────────

describe("buildNavItems — plain staff", () => {
  const user = { isAdmin: false, isAssistant: false };

  test("sees exactly 3 tabs", () => {
    expect(buildNavItems(user)).toHaveLength(3);
  });

  test("does not see tracking, fuel, or maintenance", () => {
    const nav = ids(buildNavItems(user));
    expect(nav).not.toContain("tracking");
    expect(nav).not.toContain("fuel");
    expect(nav).not.toContain("maintenance");
  });

  test("does not see approvals or users", () => {
    const nav = ids(buildNavItems(user));
    expect(nav).not.toContain("approvals");
    expect(nav).not.toContain("users");
  });
});

// ── Assistant ──────────────────────────────────────────────────

describe("buildNavItems — assistant", () => {
  const user = { isAdmin: false, isAssistant: true };

  test("sees 6 tabs (base 3 + tracking, fuel, maintenance)", () => {
    expect(buildNavItems(user)).toHaveLength(6);
  });

  test("sees tracking, fuel, and maintenance", () => {
    const nav = ids(buildNavItems(user));
    expect(nav).toContain("tracking");
    expect(nav).toContain("fuel");
    expect(nav).toContain("maintenance");
  });

  test("does not see approvals or users", () => {
    const nav = ids(buildNavItems(user));
    expect(nav).not.toContain("approvals");
    expect(nav).not.toContain("users");
  });
});

// ── Admin ──────────────────────────────────────────────────────

describe("buildNavItems — admin", () => {
  const user = { isAdmin: true, isAssistant: false };

  test("sees all 8 tabs", () => {
    expect(buildNavItems(user)).toHaveLength(8);
  });

  test("sees tracking, fuel, and maintenance", () => {
    const nav = ids(buildNavItems(user));
    expect(nav).toContain("tracking");
    expect(nav).toContain("fuel");
    expect(nav).toContain("maintenance");
  });

  test("sees approvals and users", () => {
    const nav = ids(buildNavItems(user));
    expect(nav).toContain("approvals");
    expect(nav).toContain("users");
  });
});

// ── Approvals label with pending count ────────────────────────

describe("buildNavItems — approvals label", () => {
  const admin = { isAdmin: true, isAssistant: false };

  test("shows 'Approvals' when pending count is 0", () => {
    const item = buildNavItems(admin, 0).find((i) => i.id === "approvals");
    expect(item.label).toBe("Approvals");
  });

  test("shows 'Approve(N)' when there are pending trips", () => {
    const item = buildNavItems(admin, 3).find((i) => i.id === "approvals");
    expect(item.label).toBe("Approve(3)");
  });

  test("updates label correctly for any positive count", () => {
    expect(buildNavItems(admin, 1).find((i) => i.id === "approvals").label).toBe("Approve(1)");
    expect(buildNavItems(admin, 10).find((i) => i.id === "approvals").label).toBe("Approve(10)");
  });

  test("non-admin never sees approvals tab regardless of pending count", () => {
    const nav = ids(buildNavItems({ isAdmin: false, isAssistant: false }, 5));
    expect(nav).not.toContain("approvals");
  });
});
