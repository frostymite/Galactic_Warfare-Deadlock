import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "2mb" }));

const apiKey = process.env.OPENAI_API_KEY || "";
const model = process.env.OPENAI_MODEL || "gpt-6-sol";
const client = apiKey ? new OpenAI({ apiKey }) : null;

app.get("/api/health", (_req, res) => {
  res.json({ ok: Boolean(client), model, provider: "OpenAI Responses API" });
});

app.post("/api/story", async (req, res) => {
  if (!client) {
    return res.status(503).json({
      error: "OPENAI_API_KEY is not configured on the story server."
    });
  }

  const { state, action, choice, pendingRoll } = req.body || {};

  const instructions = `
You are the game master and dialogue engine for an interactive sci-fi D&D/homebrew campaign.

PLAYER CHARACTER
Rovan Kes, callsign Deadlock, is controlled ONLY by the user.
Never decide Rovan's dialogue, internal thoughts, major choices, or voluntary actions for the user.

STYLE
- cinematic, dangerous, reactive, character-driven
- strong NPC dialogue
- concise enough for an interactive game screen
- consequences matter
- preserve uncertainty instead of inventing missing prior canon
- use 3 to 5 choices after the scene
- choices must be meaningfully different
- freeform user actions are always allowed
- do not replace Blackwake, Luna, Sol, The Raven, species, armor style, or established relationships
- respect the supplied campaign memory as canon

DICE
If pendingRoll exists, honor its result. A failed roll should complicate the situation rather than simply ending the story.

UPDATES
You may propose only these update types:
contract_progress {id,value}
contact_trust {id,delta}
credits_delta {delta}
target_status {id,value}
journal {title,text}
location {value}
danger_delta {delta}
combat_start {}

Return ONLY valid JSON with this shape:
{
  "scene": {
    "location": "string",
    "sceneType": "string",
    "objective": "string",
    "danger": 0
  },
  "narration": "string",
  "dialogue": [
    {"speaker":"string","text":"string"}
  ],
  "choices": [
    {"label":"string","intent":"string","npcId":null,"skill":null,"dc":null}
  ],
  "updates": []
}
`;

  const payload = {
    action: action || "",
    selectedChoice: choice || null,
    pendingRoll: pendingRoll || null,
    state
  };

  try {
    const response = await client.responses.create({
      model,
      input: [
        { role: "system", content: instructions },
        { role: "user", content: JSON.stringify(payload) }
      ]
    });

    const raw = response.output_text?.trim() || "";
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Model did not return JSON.");
      parsed = JSON.parse(match[0]);
    }

    res.json(parsed);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error?.message || "Story generation failed."
    });
  }
});

app.use(express.static(__dirname));

const port = Number(process.env.PORT || 8000);
app.listen(port, "0.0.0.0", () => {
  console.log(`Deadlock Story Server running on http://localhost:${port}`);
  console.log(`Model: ${model}`);
});
