import { describe, it, expect } from "vitest";
import { sanitizeUser } from "../../server/replit_integrations/auth/sanitize";

describe("sanitizeUser", () => {
  const fullRow = {
    id: "user-1",
    email: "a@b.com",
    firstName: "A",
    passwordHash: "$2b$12$secret-hash",
    passwordResetToken: "deadbeef",
    passwordResetTokenExpiresAt: new Date(),
    plan: "free",
  };

  it("strips passwordHash and reset-token fields", () => {
    const out = sanitizeUser(fullRow);
    expect(out).not.toHaveProperty("passwordHash");
    expect(out).not.toHaveProperty("passwordResetToken");
    expect(out).not.toHaveProperty("passwordResetTokenExpiresAt");
  });

  it("keeps all non-credential fields", () => {
    const out = sanitizeUser(fullRow);
    expect(out).toMatchObject({ id: "user-1", email: "a@b.com", firstName: "A", plan: "free" });
  });

  it("passes through null and undefined", () => {
    expect(sanitizeUser(null)).toBeNull();
    expect(sanitizeUser(undefined)).toBeUndefined();
  });

  it("does not mutate the input row", () => {
    sanitizeUser(fullRow);
    expect(fullRow.passwordHash).toBe("$2b$12$secret-hash");
  });
});
