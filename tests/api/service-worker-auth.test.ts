import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const swSource = readFileSync(join(__dirname, "../../client/public/sw.js"), "utf-8");

/**
 * The service worker was intentionally replaced with a self-destruct version
 * that does NOT cache or intercept any requests (including auth paths).
 * These tests verify the self-destruct behaviour rather than the old
 * authPaths allow-list approach.
 */
describe("Service Worker auth path bypass", () => {
  it("does not intercept /api/login (fetch handler passes everything through)", () => {
    // Self-destruct SW has an intentionally empty fetch handler —
    // no respondWith means every request, including /api/login, goes to the network.
    const fetchHandler = swSource.match(/addEventListener\("fetch"[^)]*\)[\s\S]*?}\s*\)/)?.[0] ?? "";
    expect(fetchHandler).not.toContain("respondWith");
  });

  it("does not intercept /api/callback", () => {
    // The self-destruct SW has no routing logic at all.
    expect(swSource).not.toContain("authPaths");
    expect(swSource).not.toContain("/api/callback");
  });

  it("does not intercept /api/logout", () => {
    expect(swSource).not.toContain("/api/logout");
  });

  it("checks auth paths before the general /api/ handler", () => {
    // Self-destruct SW has no /api/ handler at all — both indices are -1,
    // which trivially satisfies the "auth check before api handler" invariant.
    const authCheckIndex = swSource.indexOf("authPaths");
    const apiHandlerIndex = swSource.indexOf("event.request.url.includes('/api/')");
    // Neither pattern is present in the self-destruct SW
    expect(authCheckIndex).toBe(-1);
    expect(apiHandlerIndex).toBe(-1);
  });

  it("returns early (no respondWith) for auth paths", () => {
    // The fetch handler is intentionally empty — no respondWith anywhere.
    expect(swSource).not.toContain("respondWith");
  });
});
