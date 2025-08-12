import express from "express";

const router = express.Router();

const SYSTEM = `You convert short scheduling commands into JSON actions.
Schema:
{
  "actions":[
    {"type":"move_employee","employee_query":"string","project":"string"},
    {"type":"assign_equipment","equipment_query":"string","project":"string"},
    {"type":"list_unassigned","date?":"YYYY-MM-DD"}
  ]
}
Rules:
- Output ONLY JSON. No extra text.
- If unsure, guess sensibly.`;

router.post("/nl", async (req, res) => {
  const { text } = req.body as { text: string };
  
  // For now, return a simple parser until OpenAI API is configured
  // This provides basic functionality without requiring API keys
  try {
    const actions = parseSimpleCommands(text);
    return res.json({ actions });
  } catch (error) {
    return res.json({ actions: [] });
  }
});

// Simple command parser for basic functionality
function parseSimpleCommands(text: string): any[] {
  const lower = text.toLowerCase();
  const actions: any[] = [];

  // Parse "move [employee] to [project]" commands
  const moveMatch = lower.match(/move\s+(.+?)\s+to\s+(.+)/);
  if (moveMatch) {
    actions.push({
      type: "move_employee",
      employee_query: moveMatch[1].trim(),
      project: moveMatch[2].trim()
    });
  }

  // Parse "assign [equipment] to [project]" commands
  const assignMatch = lower.match(/assign\s+(.+?)\s+to\s+(.+)/);
  if (assignMatch) {
    actions.push({
      type: "assign_equipment",
      equipment_query: assignMatch[1].trim(),
      project: assignMatch[2].trim()
    });
  }

  // Parse "list unassigned" or "show unassigned" commands
  if (lower.includes("list unassigned") || lower.includes("show unassigned")) {
    actions.push({
      type: "list_unassigned"
    });
  }

  return actions;
}

export default router;