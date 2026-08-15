import bcrypt from "bcrypt";

describe("Password hashing", () => {
  it("should hash and verify a password", async () => {
    const password = "StrongPassword123!";

    const hash = await bcrypt.hash(password, 12);

    expect(hash).not.toBe(password);

    const result = await bcrypt.compare(password, hash);

    expect(result).toBe(true);
  });

  it("should reject an incorrect password", async () => {
    const password = "StrongPassword123!";

    const hash = await bcrypt.hash(password, 12);

    const result = await bcrypt.compare("WrongPassword123!", hash);

    expect(result).toBe(false);
  });
});
