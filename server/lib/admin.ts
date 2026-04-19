/**
 * Admin authorization — email whitelist via ADMIN_EMAILS env var.
 * Comma-separated list of emails that get admin-tier access.
 */

import type { Request, Response, NextFunction } from "express";

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user;
  const email = user?.email || user?.claims?.email;
  if (!isAdminEmail(email)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
