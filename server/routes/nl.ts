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
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Fallback to simple parser when no API key is provided
    try {
      const actions = parseSimpleCommands(text);
      return res.json({ actions });
    } catch (error) {
      return res.json({ actions: [] });
    }
  }

  try {
    // OpenAI integration when API key is available
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: text ?? "" }
      ],
      temperature: 0
    });

    const out = completion.choices[0]?.message?.content?.trim() || "{}";
    try {
      const json = JSON.parse(out);
      return res.json(json);
    } catch {
      // Fallback to simple parser if OpenAI response is invalid
      const actions = parseSimpleCommands(text);
      return res.json({ actions });
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Fallback to simple parser on OpenAI error
    try {
      const actions = parseSimpleCommands(text);
      return res.json({ actions });
    } catch {
      return res.json({ actions: [] });
    }
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