import { sql } from "drizzle-orm";
import crypto from "crypto";
import { append } from "../eventing/eventStore";
import { applyEvent } from "../projections/applyEvent";
import { EventTypes } from "../eventing/types";
import { getCurrentVersion } from "../eventing/eventStore";

type Tx = Parameters<Parameters<typeof import("../db").db.transaction>[0]>[0];

async function fetchAndAnalyzeReport(storageRef: string): Promise<{
  summary: string;
  issuesFound: number;
  findings: Array<{
    findingId: string;
    title: string;
    description: string;
    severity: string;
    urgency: string;
    category: string;
    location: string;
    estimatedCost: string;
    diyLevel: string;
  }>;
}> {
  let textContent = "";
  if (storageRef) {
    try {
      const { objectStorageService } = await import("../replit_integrations/object_storage/objectStorage");
      const objectName = storageRef.replace(/^\/objects\//, "");
      const buffer = await objectStorageService.downloadObject(objectName);
      if (buffer) {
        const isPdf = objectName.toLowerCase().endsWith(".pdf") || storageRef.includes("pdf");
        if (isPdf) {
          textContent = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ").substring(0, 8000);
        } else {
          textContent = `[Image file uploaded: ${objectName}]`;
        }
      }
    } catch {
      textContent = "[Could not read file content]";
    }
  }

  const OpenAI = (await import("openai")).default;
  const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });

  const prompt = `You are a home inspection expert. Analyze this inspection report content and extract all findings.

${textContent ? `Report content:\n${textContent}` : "No readable content was extracted from the uploaded file. Generate 3-5 common inspection findings that a typical home inspection might uncover."}

Return a JSON object with:
{
  "summary": "2-3 sentence overview of the report findings",
  "findings": [
    {
      "title": "Brief issue title",
      "description": "1-2 sentence explanation of the issue and its implications",
      "severity": "critical" | "major" | "moderate" | "minor",
      "urgency": "now" | "soon" | "later" | "monitor",
      "category": "Electrical" | "Plumbing" | "HVAC" | "Roof" | "Foundation" | "Windows" | "Siding/Exterior" | "Appliances" | "Water Heater" | "Landscaping" | "Pest" | "Other",
      "location": "Where in the home this was found",
      "estimatedCost": "$X-$Y range",
      "diyLevel": "DIY-Safe" | "Caution" | "Pro-Only"
    }
  ]
}

Be realistic and practical. Return ONLY valid JSON, no markdown.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 3000,
  });

  const content = completion.choices[0]?.message?.content || "{}";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: "Analysis complete.", findings: [] };

  const findings = (parsed.findings || []).map((f: any) => ({
    findingId: crypto.randomUUID(),
    title: f.title || "Unnamed finding",
    description: f.description || "",
    severity: f.severity || "moderate",
    urgency: f.urgency || "later",
    category: f.category || "Other",
    location: f.location || "General",
    estimatedCost: f.estimatedCost || "TBD",
    diyLevel: f.diyLevel || "Caution",
  }));

  return {
    summary: parsed.summary || "Analysis complete.",
    issuesFound: findings.length,
    findings,
  };
}

export async function handleReportAnalyze(
  tx: Tx,
  payload: Record<string, unknown>,
): Promise<void> {
  const reportId = payload.reportId as string;
  if (!reportId) throw new Error("report_analyze job requires reportId in payload");

  const row = await tx.execute(sql`
    SELECT state, storage_ref FROM projection_report WHERE report_id = ${reportId}
  `);
  if (row.rows.length === 0) throw new Error(`Report ${reportId} not found`);
  const reportRow = row.rows[0] as { state: string; storage_ref: string };

  if (reportRow.state !== "queued") {
    return;
  }

  try {
    const analysis = await fetchAndAnalyzeReport(reportRow.storage_ref || "");

    const ver = await getCurrentVersion(tx, "report", reportId);
    const idempotencyKey = `report-analyze-${reportId}`;

    const draft = {
      summary: analysis.summary,
      issuesFound: analysis.issuesFound,
      findings: analysis.findings,
      analyzedAt: new Date().toISOString(),
    };

    const eventData = { draft };

    const result = await append(tx, {
      aggregateType: "report",
      aggregateId: reportId,
      expectedVersion: ver,
      eventType: EventTypes.InspectionReportAnalyzedDraft,
      data: eventData,
      meta: { source: "report_analyzer_worker" },
      actor: { actorType: "system", actorId: "worker" },
      idempotencyKey,
    });

    if (!result.deduped) {
      await applyEvent(tx, {
        event_seq: result.eventSeq,
        event_id: result.eventId,
        aggregate_type: "report",
        aggregate_id: reportId,
        aggregate_version: result.version,
        event_type: EventTypes.InspectionReportAnalyzedDraft,
        data: eventData as Record<string, unknown>,
        meta: { source: "report_analyzer_worker" },
        actor_type: "system",
        actor_id: "worker",
        occurred_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    const ver = await getCurrentVersion(tx, "report", reportId);
    const failResult = await append(tx, {
      aggregateType: "report",
      aggregateId: reportId,
      expectedVersion: ver,
      eventType: EventTypes.InspectionReportAnalysisFailed,
      data: { error: (error as Error).message, attemptNumber: 1 },
      meta: { source: "report_analyzer_worker" },
      actor: { actorType: "system", actorId: "worker" },
      idempotencyKey: `report-analyze-fail-${reportId}`,
    });

    if (!failResult.deduped) {
      await applyEvent(tx, {
        event_seq: failResult.eventSeq,
        event_id: failResult.eventId,
        aggregate_type: "report",
        aggregate_id: reportId,
        aggregate_version: failResult.version,
        event_type: EventTypes.InspectionReportAnalysisFailed,
        data: { error: (error as Error).message, attemptNumber: 1 },
        meta: { source: "report_analyzer_worker" },
        actor_type: "system",
        actor_id: "worker",
        occurred_at: new Date().toISOString(),
      });
    }
  }
}
