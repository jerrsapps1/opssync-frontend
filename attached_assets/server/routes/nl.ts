import express from "express";
import OpenAI from "openai";

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
    return res.json({ actions: [] });
  }

  const client = new OpenAI({ apiKey });

  const rsp = await client.responses.create({
    model: "gpt-5.1-mini",
    input: [
      { role: "system", content: SYSTEM },
      { role: "user", content: text ?? "" }
    ]
  });

  const out = (rsp.output_text || "{}").trim();
  try {
    const json = JSON.parse(out);
    return res.json(json);
  } catch {
    return res.json({ actions: [] });
  }
});

export default router;
