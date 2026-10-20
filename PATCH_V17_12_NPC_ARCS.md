# Deadlock v17.12.0 — Long-Term NPC Arcs

This Phase 3 increment turns repeated NPC behavior into persistent personal and relationship story arcs.

## Personal arcs

Major NPCs can develop long-running arcs grounded in their actual agenda activity.

Current arc families include:

- Jessa — **Signal Beneath the Noise** / **The Cost of Perfect Systems**
- Dren Voss — **The Hunter Behind the Hunt** / **Proof and Instinct**
- Nera Kade — **The Risk She Won’t Price** / **Leverage Without Control**
- Renn — **The Exit Nobody Wants** / **Routes Don’t Lie**

Each arc stores:

- template and actor identity,
- persistent progress and pressure,
- current stage,
- player-response count,
- source agenda history,
- optional thread IDs,
- hidden secret IDs,
- favor IDs,
- bounded beat history.

## Arc stages

Arcs progress through authored procedural stages rather than completing automatically:

1. seed,
2. developing,
3. active,
4. turning point,
5. player resolution.

Background simulation may develop an arc up to its turning point. Once the turning point is reached, progress freezes until Rovan responds.

## Secrets

Arc secrets begin as hidden private concerns.

The UI may show that an unresolved private thread exists, but the actual revealed content is not displayed until the player successfully uncovers it.

Secrets are framed as unverified/private concerns until revealed so the engine does not silently invent hard canon.

## Favors

Personal arcs can generate favors.

Favors are optional Story threads, not automatic commitments. They cannot spend credits, transfer Apex funds, change contract ownership, or consume player resources simply because an NPC asked.

Successful player action can fulfill a favor. Unresolved favors remain visible in the Personal Arcs panel.

## Relationship arcs

The existing NPC-to-NPC relationship web now produces longer-term states:

- Working Trust
- Working Alliance
- Fault Line
- Open Grudge

Relationship arcs are driven by the actual cooperation/tension values accumulated in `story.npcAgendas.relations`.

Examples:

- repeated Dren/Renn cooperation can become a Working Alliance,
- repeated Dren/Nera friction can become an Open Grudge.

These states remain separate from Rovan's personal trust/reputation relationships.

## Story integration

Long-term arcs can now enter:

- procedural mission choices,
- focused NPC dialogue,
- context-sensitive dialogue updates,
- NPC Initiative,
- the Story page's Personal Arcs panel.

The Story Director prioritizes unresolved turning points, relationship conflicts, favors, secrets and side threads without replacing the existing contract or Living World systems.

## Player-controlled resolution

Arc responses use the normal Story action/check path.

A player can:

- investigate a side thread,
- probe a hidden concern,
- fulfill a favor,
- mediate a relationship thread,
- commit to a turning-point decision,
- defer or decline an arc interaction.

Resolving a personal arc closes its sibling open threads. Hidden secrets remain hidden if the player never uncovered them.

## Safety boundaries

NPC arcs cannot directly:

- spend Rovan's credits,
- spend Apex reserves,
- accept or finish contracts,
- change contract progress or payouts,
- collect XP/rewards,
- launch Apex assets,
- change ship ownership,
- make command decisions for Deadlock.

## Offline / portability

The arc engine lives in `runtime/npc-arcs.js`, persists as plain JSON under `story.npcArcs`, loads after `npc-agendas.js` and before `story-director.js`, and is cached for offline play.

## Validation

The combined v17.12 source/integration harness passed **30 / 30 checks**.

Validation covered:

- all four major NPCs developing grounded arcs,
- hidden secrets remaining hidden automatically,
- favor generation,
- turning-point freeze,
- single unresolved decision thread per arc,
- player secret reveal,
- player favor completion,
- player-controlled arc resolution,
- sibling-thread cleanup after resolution,
- relationship evolution,
- deterministic grudge formation through repeated friction,
- deterministic alliance formation through repeated cooperation,
- Story choice/dialogue integration,
- NPC Initiative compatibility,
- package/load-order/offline wiring,
- protected campaign economy/contract/ship state remaining unchanged.
