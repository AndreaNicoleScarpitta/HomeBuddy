import { Home, Wrench, MessageSquare, User, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";

export const HOME_PROFILE = {
  address: "123 Maple Street, Springfield, IL",
  builtYear: 1985,
  sqFt: 2400,
  type: "Single Family",
  healthScore: 82,
  systems: [
    { name: "HVAC", age: 4, status: "good", lastService: "2024-05-10" },
    { name: "Roof", age: 12, status: "warning", lastService: "2012-08-15" },
    { name: "Water Heater", age: 8, status: "good", lastService: "2023-11-20" },
    { name: "Plumbing", age: 15, status: "good", lastService: "2024-01-05" },
    { name: "Electrical", age: 39, status: "good", lastService: "2015-03-12" },
  ]
};

export const MAINTENANCE_TASKS = [
  {
    id: 1,
    title: "Change HVAC Filter",
    category: "Routine",
    dueDate: "2025-02-01",
    urgency: "now", // Now, Soon, Later, Monitor
    diyLevel: "DIY-Safe", // DIY-Safe, Pro-Recommended, Permit-Required
    status: "pending",
    estimatedCost: "$20",
    difficulty: "Easy",
    safetyWarning: null
  },
  {
    id: 2,
    title: "Inspect Roof Shingles",
    category: "Inspection",
    dueDate: "2025-03-15",
    urgency: "soon",
    diyLevel: "Caution",
    status: "pending",
    estimatedCost: "Free (Self) or $150 (Pro)",
    difficulty: "Medium",
    safetyWarning: "Ladder safety required. Do not attempt if wet."
  },
  {
    id: 3,
    title: "Flush Water Heater",
    category: "Maintenance",
    dueDate: "2025-04-10",
    urgency: "later",
    diyLevel: "DIY-Safe",
    status: "scheduled",
    estimatedCost: "$200",
    difficulty: "Hard",
    safetyWarning: "Hot water hazard."
  },
  {
    id: 4,
    title: "Clean Gutters",
    category: "Seasonal",
    dueDate: "2024-11-15",
    urgency: "now",
    diyLevel: "Caution",
    status: "overdue",
    estimatedCost: "$150",
    difficulty: "Medium",
    safetyWarning: "Ladder safety required."
  },
  {
    id: 5,
    title: "Foundation Crack",
    category: "Structural",
    dueDate: "2025-06-01",
    urgency: "monitor",
    diyLevel: "Pro-Only",
    status: "pending",
    estimatedCost: "$500 - $2,000",
    difficulty: "Expert",
    safetyWarning: "Structural integrity risk. Permit likely required."
  }
];

export const CHAT_HISTORY = [
  {
    role: "assistant",
    content: "Hi! I'm Home Buddy. I've analyzed your home profile. Based on your home's age (1985) and your last roof inspection, I'd recommend checking your roof shingles soon. How can I help you today?"
  }
];
