const { hashPw, checkPassword } = require("./logic");

describe("hashPw", () => {
  test("returns a non-empty string", () => {
    expect(typeof hashPw("abc")).toBe("string");
    expect(hashPw("abc").length).toBeGreaterThan(0);
  });

  test("is deterministic — same input always gives same hash", () => {
    expect(hashPw("360664")).toBe(hashPw("360664"));
    expect(hashPw("mySecret!")).toBe(hashPw("mySecret!"));
  });

  test("different passwords produce different hashes", () => {
    expect(hashPw("360664")).not.toBe(hashPw("360665"));
    expect(hashPw("password1")).not.toBe(hashPw("password2"));
  });

  test("includes the salt so bare password !== hash of password", () => {
    const plain = "360664";
    expect(hashPw(plain)).not.toBe(plain);
  });

  test("handles special characters without throwing", () => {
    expect(() => hashPw("p@$$w0rd!#%&")).not.toThrow();
    expect(() => hashPw("café")).not.toThrow();
  });

  test("handles empty string without throwing", () => {
    expect(() => hashPw("")).not.toThrow();
    expect(typeof hashPw("")).toBe("string");
  });
});

describe("checkPassword — default password (no entry in passwords map)", () => {
  test("accepts pfId as default password when no password is set", () => {
    expect(checkPassword("360664", "360664", {})).toBe(true);
  });

  test("rejects wrong password when no password is set", () => {
    expect(checkPassword("360664", "wrongpass", {})).toBe(false);
    expect(checkPassword("360664", "", {})).toBe(false);
  });

  test("missing passwords map defaults to empty (same as default password)", () => {
    expect(checkPassword("360664", "360664")).toBe(true);
    expect(checkPassword("360664", "wrong")).toBe(false);
  });

  test("default password is pfId — not empty string", () => {
    expect(checkPassword("123456", "", {})).toBe(false);
  });
});

describe("checkPassword — stored hashed password", () => {
  test("accepts correct password that matches stored hash", () => {
    const passwords = { "360664": hashPw("newSecret1") };
    expect(checkPassword("360664", "newSecret1", passwords)).toBe(true);
  });

  test("rejects wrong password when hash is stored", () => {
    const passwords = { "360664": hashPw("newSecret1") };
    expect(checkPassword("360664", "wrongpass", passwords)).toBe(false);
    expect(checkPassword("360664", "360664", passwords)).toBe(false); // old default no longer works
  });

  test("rejects empty string against stored hash", () => {
    const passwords = { "360664": hashPw("somepass") };
    expect(checkPassword("360664", "", passwords)).toBe(false);
  });

  test("password check is user-specific — other users unaffected", () => {
    const passwords = { "360664": hashPw("adminPass") };
    // User 360664 must use their new password
    expect(checkPassword("360664", "adminPass", passwords)).toBe(true);
    // User 361739 has no entry → still uses their pfId as default
    expect(checkPassword("361739", "361739", passwords)).toBe(true);
    expect(checkPassword("361739", "adminPass", passwords)).toBe(false);
  });

  test("stored hash for one user does not unlock another user", () => {
    const passwords = { "360664": hashPw("sharedPassword") };
    expect(checkPassword("999999", "sharedPassword", passwords)).toBe(false);
  });
});
