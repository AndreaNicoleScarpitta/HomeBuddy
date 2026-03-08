import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractTextFromDocument,
  analyzeDocumentWithLLM,
  convertIssuesToTasks,
  documentAnalysisResponseSchema,
  type ExtractedIssue,
} from "../server/lib/document-analysis";

vi.mock("openai", () => {
  const create = vi.fn();
  return {
    default: class {
      chat = { completions: { create } };
    },
    __mockCreate: create,
  };
});

vi.mock("../server/storage", () => ({
  storage: {
    getHomeById: vi.fn().mockResolvedValue({
      id: 1,
      city: "Austin",
      state: "TX",
      builtYear: 1995,
      sqFt: 2000,
      type: "Single Family",
    }),
  },
}));

vi.mock("../server/lib/logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

async function getMockCreate() {
  const mod = await import("openai");
  return (mod as any).__mockCreate as ReturnType<typeof vi.fn>;
}

describe("Document Analysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extractTextFromDocument", () => {
    it("should extract text from a PDF buffer", async () => {
      vi.doMock("pdf-parse", () => ({
        default: vi.fn().mockResolvedValue({ text: "Roof needs repair. Plumbing leak in basement." }),
      }));

      const buffer = Buffer.from("fake pdf content");
      const text = await extractTextFromDocument(buffer, "application/pdf");
      expect(text).toBe("Roof needs repair. Plumbing leak in basement.");
    });

    it("should extract text from a plain text buffer", async () => {
      const content = "The HVAC system is making unusual noises.";
      const buffer = Buffer.from(content, "utf-8");
      const text = await extractTextFromDocument(buffer, "text/plain");
      expect(text).toBe(content);
    });

    it("should throw for unsupported file types", async () => {
      const buffer = Buffer.from("data");
      await expect(
        extractTextFromDocument(buffer, "application/msword")
      ).rejects.toThrow("Unsupported file type");
    });
  });

  describe("analyzeDocumentWithLLM", () => {
    it("should return valid structured JSON from the LLM", async () => {
      const mockCreate = await getMockCreate();
      const mockResponse = {
        issues: [
          {
            title: "Roof shingles deteriorating",
            description: "Multiple shingles showing wear and curling",
            category: "Roof",
            urgency: "soon",
            diyLevel: "Pro-Only",
            estimatedCost: "$2,000-$5,000",
            safetyWarning: "Do not attempt roof work without proper safety equipment",
          },
          {
            title: "Slow drain in kitchen sink",
            description: "Kitchen drain is slow, possible partial clog",
            category: "Plumbing",
            urgency: "later",
            diyLevel: "DIY-Safe",
            estimatedCost: "$20-$50",
            safetyWarning: null,
          },
        ],
      };

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockResponse) } }],
      });

      const result = await analyzeDocumentWithLLM("Roof inspection shows deteriorating shingles. Kitchen drain slow.", 1);

      expect(result.issues).toHaveLength(2);
      expect(result.issues[0].title).toBe("Roof shingles deteriorating");
      expect(result.issues[0].urgency).toBe("soon");
      expect(result.issues[1].category).toBe("Plumbing");
    });

    it("should throw on malformed JSON from LLM", async () => {
      const mockCreate = await getMockCreate();
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: "not valid json {{{" } }],
      });

      await expect(
        analyzeDocumentWithLLM("Some text", 1)
      ).rejects.toThrow("malformed response");
    });

    it("should throw on empty LLM response", async () => {
      const mockCreate = await getMockCreate();
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      await expect(
        analyzeDocumentWithLLM("Some text", 1)
      ).rejects.toThrow("empty response");
    });
  });

  describe("documentAnalysisResponseSchema validation", () => {
    it("should validate a correct response", () => {
      const valid = {
        issues: [
          {
            title: "Fix gutter",
            description: "Gutters are clogged",
            category: "Other",
            urgency: "soon",
            diyLevel: "DIY-Safe",
            estimatedCost: "$50-$100",
            safetyWarning: null,
          },
        ],
      };
      const result = documentAnalysisResponseSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject a response with missing title", () => {
      const invalid = {
        issues: [{ description: "Missing title field" }],
      };
      const result = documentAnalysisResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should apply defaults for optional fields", () => {
      const minimal = {
        issues: [{ title: "Basic issue" }],
      };
      const result = documentAnalysisResponseSchema.safeParse(minimal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.issues[0].urgency).toBe("later");
        expect(result.data.issues[0].diyLevel).toBe("Caution");
        expect(result.data.issues[0].category).toBe("Other");
      }
    });
  });

  describe("convertIssuesToTasks", () => {
    it("should correctly convert extracted issues to task objects", () => {
      const issues: ExtractedIssue[] = [
        {
          title: "Replace water heater",
          description: "Water heater is 15 years old and showing signs of corrosion",
          category: "Water Heater",
          urgency: "soon",
          diyLevel: "Pro-Only",
          estimatedCost: "$1,500-$3,000",
          safetyWarning: "Involves gas/electrical connections",
        },
        {
          title: "Clean gutters",
          description: "Gutters filled with debris",
          category: "Other",
          urgency: "later",
          diyLevel: "DIY-Safe",
          estimatedCost: "$0-$50",
          safetyWarning: null,
        },
      ];

      const tasks = convertIssuesToTasks(issues, 42);

      expect(tasks).toHaveLength(2);

      expect(tasks[0].homeId).toBe(42);
      expect(tasks[0].title).toBe("Replace water heater");
      expect(tasks[0].urgency).toBe("soon");
      expect(tasks[0].diyLevel).toBe("Pro-Only");
      expect(tasks[0].createdFrom).toBe("document-analysis");
      expect(tasks[0].status).toBe("pending");
      expect(tasks[0].safetyWarning).toBe("Involves gas/electrical connections");

      expect(tasks[1].homeId).toBe(42);
      expect(tasks[1].title).toBe("Clean gutters");
      expect(tasks[1].category).toBe("Other");
      expect(tasks[1].safetyWarning).toBeNull();
    });

    it("should handle empty issues array", () => {
      const tasks = convertIssuesToTasks([], 1);
      expect(tasks).toEqual([]);
    });
  });

  describe("UI task review (schema contract)", () => {
    it("should produce tasks with all fields needed for UI display before confirmation", () => {
      const issues: ExtractedIssue[] = [
        {
          title: "Foundation crack observed",
          description: "Hairline crack in southeast corner of foundation",
          category: "Foundation",
          urgency: "now",
          diyLevel: "Pro-Only",
          estimatedCost: "$500-$2,000",
          safetyWarning: "Structural issue — do not ignore",
        },
      ];

      const tasks = convertIssuesToTasks(issues, 10);
      const task = tasks[0];

      expect(task).toHaveProperty("title");
      expect(task).toHaveProperty("description");
      expect(task).toHaveProperty("category");
      expect(task).toHaveProperty("urgency");
      expect(task).toHaveProperty("diyLevel");
      expect(task).toHaveProperty("estimatedCost");
      expect(task).toHaveProperty("safetyWarning");
      expect(task).toHaveProperty("homeId");
      expect(task).toHaveProperty("createdFrom");
      expect(task).toHaveProperty("status");

      expect(task.status).toBe("pending");
      expect(task.createdFrom).toBe("document-analysis");
    });
  });
});
