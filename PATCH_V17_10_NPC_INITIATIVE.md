# Deadlock v17.10.0 — NPC Initiative

This Phase 3 increment gives the world permission to act without waiting for Deadlock to choose a menu option.

## Unsolicited character beats

The procedural Story Director can now create initiative from:

- Jessa when Raven systems are deteriorating,
- Dren when a live lead or rumor is moving,
- Renn when danger rises enough to justify breaking radio silence,
- Nera Kade when an active contract needs attention,
- ambient Living World NPCs tied to active rumors,
- prior player decisions that become relevant again several turns later.

## One interruption system

NPC Initiative reuses the existing Story interruption layer. It does not replace the mission menu beneath it.

Each initiative can offer contextual responses such as:

- hear the contact out,
- press for the one detail that changes the decision,
- independently verify the claim,
- authorize a repair,
- trace an ambient rumor source,
- revisit or defend an older decision,
- acknowledge the interruption and keep the current plan moving.

## Persistence and throttling

State lives under `story.proceduralDirector.initiative`.

The director stores:

- last initiative turn,
- cooldown-until turn,
- recent initiative kinds,
- recent contact IDs,
- bounded initiative history.

Initiative cannot spawn when another interruption is pending, twice on the same turn, or before its deterministic cooldown expires. Recent kinds and contacts are biased away from immediate repetition.

## Cross-system behavior

- Jessa's ship-system initiative can apply actual repair consequences through the existing Story skill-check path.
- Rumor-linked initiative can promote a Living World rumor into a persistent procedural Story lead.
- Ambient NPC initiative keeps the original ambient NPC identity and rumor link.
- Memory initiative only resurfaces recorded player actions, not system-generated events.
- No initiative automatically grants credits, XP, contract completion, or canon changes.

## Validation

- NPC Initiative simulation/integration harness: **46 / 46 passed**
- Verified crew, intel, warning, contract, ambient, and memory initiative sources.
- Verified pending-interruption blocking, same-turn blocking, multi-turn cooldown, bounded history, and contact/kind variety.
- Long simulation produced initiative from Jessa, Dren Voss, Renn, Nera Kade, and an ambient mechanic without firing every turn.
- App integration verified for initiative materialization, Story UI, rumor verification, and system-repair consequences.
