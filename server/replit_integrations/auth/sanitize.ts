/**
 * Strip credential fields from a user row before it leaves the API.
 * passwordHash and reset-token material must never reach the client —
 * every route that serializes a users row goes through this.
 */
export function sanitizeUser(u: any) {
  if (!u) return u;
  const { passwordHash, passwordResetToken, passwordResetTokenExpiresAt, ...rest } = u;
  return rest;
}
