# Deadlock v17.9.0 — Procedural Story Director

This Phase 3 increment replaces the repetitive fixed Story interaction loop with a persistent offline narrative director.

## Situation-driven choices

Story options are now generated from:

- active contract stage and target,
- current NPC and contact context,
- current location,
- recently selected and recently displayed options,
- latest campaign consequence,
- Raven system condition,
- living-world rumors,
- promoted procedural leads,
- current danger / story turn.

The director remembers recently displayed labels as well as selected choices, preventing unchosen menu items from reappearing immediately.

## Procedural dialogue

Dialogue still honors established NPC personality, mood, relationship and campaign memory, but the follow-up menu is rebuilt every turn.

Repeated factual responses are detected. The first verified answer is preserved; repeated questions receive a fresh status/update or a newer contextual thread instead of reproducing the same sentence indefinitely.

Current rumors and leads can enter conversation choices and NPC responses.

## Rumor -> lead bridge

A Living World rumor can now be selected directly from Story.

Working that rumor creates or updates a durable `story.proceduralLeads` record containing:

- original rumor ID,
- source scene,
- linked ShipForge ship ID when present,
- ambient NPC participant IDs,
- confidence,
- status,
- contract association when relevant.

Successful verification promotes the rumor to an active lead. Failed verification preserves it as uncertain rather than silently discarding it. Promoted rumors stop appearing as raw rumors.

## Procedural narration

The Story engine now produces context-sensitive beats for:

- investigation successes/failures,
- deception successes/failures,
- field actions,
- final-resolution attempts,
- rumor/lead work,
- generic scene advancement.

The Continue Scene action also refreshes the tactical menu through the procedural director rather than simply replaying the current objective text.

## Compatibility

- New story-director state lives under `story.proceduralDirector`.
- Procedural leads live under `story.proceduralLeads`.
- Existing contracts, relationship state, campaign memory, NPC mood, Story history, Living World state and ShipForge data remain authoritative.
- The system is fully offline and JSON-based for later native/Godot migration.
- Existing static Story arrays remain in `app.js` as a fallback if the director is unavailable.

## Validation

Combined source/integration harness:

- **71 / 71 checks passed**
- 29 distinct mission options across 12 simulated mission turns
- 19 distinct dialogue follow-ups across 10 simulated dialogue turns
- adjacent mission menus shared only one option in the validation sequence
- repeated factual dialogue was detected and changed
- Living World rumor successfully promoted to a persistent lead
- ShipForge ship linkage survived rumor promotion
- consequence-driven options appeared
- procedural narration generated different success/failure beats
- Story Director loads before `app.js`
- v17.9 offline service-worker cache includes `runtime/story-director.js`
