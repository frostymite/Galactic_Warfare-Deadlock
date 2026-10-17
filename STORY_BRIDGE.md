# AI Story Bridge

The Story Bridge exists because API keys should not be embedded in a browser/PWA.

## Browser → bridge request

POST `/api/story`

```json
{
  "state": {},
  "action": "Rovan's freeform action",
  "choice": null,
  "pendingRoll": null
}
```

## Bridge → browser response

```json
{
  "scene": {
    "location": "The Raven",
    "sceneType": "Dialogue",
    "objective": "Decide whether to trust the lead.",
    "danger": 45
  },
  "narration": "Narrative text.",
  "dialogue": [
    {"speaker": "Dren Voss", "text": "Dialogue text."}
  ],
  "choices": [
    {
      "label": "Ask Dren who else knows.",
      "intent": "dialogue",
      "npcId": "dren",
      "skill": "Negotiation",
      "dc": 12
    }
  ],
  "updates": [
    {"type":"contact_trust","id":"dren","delta":1}
  ]
}
```

The client only applies a small allowlist of update types. Arbitrary JavaScript or arbitrary property paths are not accepted.

## Current reference bridge
`story-server.mjs` uses OpenAI's Responses API.

The default model is set by `OPENAI_MODEL`, with `gpt-6-sol` as the included default.
