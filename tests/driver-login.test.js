const { validateDriverLogin, DRIVERS } = require("./logic");

describe("validateDriverLogin — successful matches", () => {
  test("matches a driver by exact phone and exact name", () => {
    const result = validateDriverLogin("7637946383", "Alam");
    expect(result).not.toBeNull();
    expect(result.id).toBe("CAR1");
    expect(result.name).toBe("Alam");
  });

  test("matches every driver in the list", () => {
    expect(validateDriverLogin("7637946383", "Alam")).not.toBeNull();
    expect(validateDriverLogin("8638183371", "Tinku")).not.toBeNull();
    expect(validateDriverLogin("7578062778", "Pinku")).not.toBeNull();
    expect(validateDriverLogin("7896993883", "Safiqul")).not.toBeNull();
  });

  test("name match is case-insensitive", () => {
    expect(validateDriverLogin("7637946383", "alam")).not.toBeNull();
    expect(validateDriverLogin("7637946383", "ALAM")).not.toBeNull();
    expect(validateDriverLogin("7637946383", "aLaM")).not.toBeNull();
  });

  test("name match trims leading/trailing whitespace", () => {
    expect(validateDriverLogin("7637946383", "  Alam  ")).not.toBeNull();
  });

  test("phone with country code prefix is stripped to last 10 digits", () => {
    expect(validateDriverLogin("+917637946383", "Alam")).not.toBeNull();
    expect(validateDriverLogin("917637946383", "Alam")).not.toBeNull();
  });

  test("phone with spaces or dashes is accepted", () => {
    expect(validateDriverLogin("763 794 6383", "Alam")).not.toBeNull();
    expect(validateDriverLogin("763-794-6383", "Alam")).not.toBeNull();
  });

  test("returns the full driver object on match", () => {
    const result = validateDriverLogin("8638183371", "Tinku");
    expect(result).toMatchObject({
      id: "CAR2",
      name: "Tinku",
      phone: "8638183371",
      vehicle: "Vehicle 2",
    });
    // role is assigned by onLogin() after login, not stored in the driver record
    expect(result.role).toBeUndefined();
  });
});

describe("validateDriverLogin — failed matches", () => {
  test("returns null when phone is correct but name is wrong", () => {
    expect(validateDriverLogin("7637946383", "Tinku")).toBeNull();
  });

  test("returns null when name is correct but phone is wrong", () => {
    expect(validateDriverLogin("0000000000", "Alam")).toBeNull();
  });

  test("returns null for completely unknown credentials", () => {
    expect(validateDriverLogin("9999999999", "Unknown")).toBeNull();
  });

  test("returns null for empty phone", () => {
    expect(validateDriverLogin("", "Alam")).toBeNull();
  });

  test("returns null for empty name", () => {
    expect(validateDriverLogin("7637946383", "")).toBeNull();
  });

  test("returns null for both empty", () => {
    expect(validateDriverLogin("", "")).toBeNull();
  });

  test("does not match a partial phone number", () => {
    // Last 10 digits of "946383" padded with zeros ≠ any driver phone
    expect(validateDriverLogin("946383", "Alam")).toBeNull();
  });
});
