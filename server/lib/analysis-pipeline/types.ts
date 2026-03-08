export const TASK_CATEGORIES = [
  "Repair",
  "Maintenance",
  "Inspection",
  "Replacement",
  "Improvement",
] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export interface SourceFileInfo {
  fileName: string;
  fileType: string;
  textLength: number;
}

export interface PreProcessorOutput {
  systemsDetected: DetectedSystem[];
  equipmentDetected: DetectedEquipment[];
  issuesDetected: DetectedIssue[];
  maintenanceRecommendations: MaintenanceRecommendation[];
  attributesDetected: DetectedAttribute[];
  safetyFindings: SafetyFinding[];
  sourceReferences: SourceReference[];
}

export interface DetectedSystem {
  name: string;
  category: string;
  confidence: number;
  sourceRef: string;
}

export interface DetectedEquipment {
  name: string;
  systemCategory: string;
  manufacturer?: string;
  model?: string;
  installDate?: string;
  sourceRef: string;
}

export interface DetectedIssue {
  description: string;
  severity: "critical" | "moderate" | "minor" | "informational";
  systemCategory: string;
  sourceRef: string;
}

export interface MaintenanceRecommendation {
  description: string;
  systemCategory: string;
  timing?: string;
  sourceRef: string;
}

export interface DetectedAttribute {
  key: string;
  value: string;
  systemCategory: string;
  confidence: number;
  sourceRef: string;
}

export interface SafetyFinding {
  description: string;
  systemCategory: string;
  severity: "critical" | "warning" | "informational";
  sourceRef: string;
}

export interface SourceReference {
  text: string;
  fileIndex: number;
  fileName: string;
}

export interface ExistingSystem {
  id: string;
  category: string;
  name: string;
  condition?: string;
  attrs?: Record<string, unknown>;
}

export interface ExistingTask {
  id: string;
  title: string;
  systemId?: string;
  status: string;
  category?: string;
}

export interface ProposedTask {
  id: string;
  title: string;
  description: string;
  systemId?: string;
  suggestionId?: string;
  category: TaskCategory;
  priority: "now" | "soon" | "later" | "monitor";
  urgency: "now" | "soon" | "later" | "monitor";
  diyLevel: "DIY-Safe" | "Caution" | "Pro-Only";
  estimatedCost?: string;
  safetyWarning?: string;
  timing?: string;
  sourceRef: string;
  isInferred: boolean;
  inferenceReason?: string;
}

export interface MatchedSystemUpdate {
  systemId: string;
  systemName: string;
  systemCategory: string;
  attributes: Record<string, string>;
  sourceRef: string;
}

export interface SuggestedSystem {
  id: string;
  name: string;
  category: string;
  reason: string;
  status: "pending" | "approved" | "declined";
  sourceRef: string;
  pendingAttributes: Record<string, string>;
  pendingTasks: ProposedTask[];
}

export interface AnalysisResult {
  matchedSystemUpdates: MatchedSystemUpdate[];
  matchedSystemTasks: ProposedTask[];
  suggestedSystems: SuggestedSystem[];
  analysisWarnings: string[];
  sourceFiles: SourceFileInfo[];
}

export interface ContractorAnalysisInput {
  preProcessorOutput: PreProcessorOutput;
  existingSystems: ExistingSystem[];
  existingTasks: ExistingTask[];
  homeId: string;
}

export interface ContractorAnalysisOutput {
  matchedSystemUpdates: MatchedSystemUpdate[];
  matchedSystemTasks: ProposedTask[];
  suggestedSystems: SuggestedSystem[];
  warnings: string[];
}
