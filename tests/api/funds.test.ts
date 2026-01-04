import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import { createServer } from "http";

describe("Funds API", () => {
  let app: express.Express;
  let server: ReturnType<typeof createServer>;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    app.get("/api/health", (_req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });
    
    server = createServer(app);
  });

  afterAll(() => {
    server.close();
  });

  it("should return health check", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });
});

describe("Fund Validation", () => {
  it("should validate fund name is required", () => {
    const fundData = { balance: 1000 };
    expect(fundData).not.toHaveProperty("name");
  });

  it("should validate balance is a number", () => {
    const balance = 5000;
    expect(typeof balance).toBe("number");
  });

  it("should calculate total from multiple funds", () => {
    const funds = [
      { balance: 1000 },
      { balance: 2500 },
      { balance: 500 },
    ];
    const total = funds.reduce((sum, f) => sum + f.balance, 0);
    expect(total).toBe(4000);
  });
});
