# Deadlock Tactical OS v9.3.3 — Tabletop Dialogue

Latest build adds one-finger unfolded scrolling and more personable offline tabletop dialogue while preserving the v9.3 consequence layer.

# Deadlock Tactical OS v7 — Offline Narrative Director

v7 makes offline play the primary game.

Once the PWA has been installed and loaded successfully at least once, the core campaign requires **no internet connection, no API key, and no server**.

## Offline-first story engine

The on-device Narrative Director tracks:
- current scene
- contracts and targets
- ship condition
- NPC trust / respect / irritation / stress / fear
- NPC memories
- recent player actions
- active campaign threads
- danger
- director tension
- recent procedural encounters
- skill checks
- current dialogue focus

It combines these systems to generate new story beats, NPC dialogue, complications, and 3–5 choices.

## NPC memory
NPCs carry persistent event tags.

Examples:
- RIFLE_RETURNED
- MARR_SPLIT
- ACTIVE_CONTRACT
- STAGED_TURNIN
- FIELD_ALLY

Those memories can be referenced in generated dialogue later.

NPC emotional values also move over time and feed their tone.

## Procedural encounters
The offline director includes weighted encounter templates such as:
- rival bounty hunter
- anonymous encrypted transmission
- Raven subsystem fault
- suspicious bounty posting
- security patrol sweep
- paid informant offer

The engine considers current campaign state before drawing an event.

Generated encounters become part of the campaign only once they actually occur during play.

## Dialogue
Dialogue is generated from:
- NPC voice profile
- relationship state
- emotion
- campaign memories
- current topic
- recent success/failure
- scene context

It is procedural rather than a fixed conversation tree.

## Skill checks
The director can attach skills and DCs to choices.
Failure creates complications instead of simply ending the scene.

## Android / no-signal play
Install the PWA while online once.

After installation:
1. Launch Deadlock once while online so the app shell caches.
2. Export a campaign backup if desired.
3. Airplane mode can be enabled.
4. Story, combat, contracts, NPC dialogue, ship systems, bounty generation, dice, saves, and procedural encounters continue to work locally.

The service worker uses a cache-first offline app shell and navigation fallback.

## Optional online AI
Online AI remains available as a secondary enhancement only.

Story → Narrative Engine → Online AI Enhancement

If the AI bridge disappears or the phone loses signal, the app falls back to the local narrative system instead of stopping the game.

Never store an API key inside the PWA.

## Current canon preserved
- Rovan Kes / Deadlock
- Clawdite
- diagonal facial scar
- obsidian + electric-cyan mercenary look
- hard armor only on vitals, shoulders, knees
- Blackwake
- Luna
- Sol
- The Raven
- Dren Voss
- Nera Kade
- Renn
- Jessa
- Marr recovery contract
- mercy circuit
- datacore extraction / destruction rule

## v6 save migration
Existing v6 JSON saves can be imported. v7 automatically adds the offline dialogue tables, NPC mood/memory state, and director state when those fields are missing.

## v7.1 integration fix
The Story tab and on-device Story UI are explicitly wired into navigation. This fixes a merge regression in the first v7 package where the Offline Director data existed but the Story page could be absent from the navigation.


## v9.3.3 — Procedural GM
Freeform Story dialogue now uses an offline personality/memory layer that assembles NPC reactions from speech intent, mood, campaign state, recent history, and established memories. No API or paid service is required.


## v9.3.4 — Ambient Soundscape & Character Voices

- Procedural low-volume ambient soundtrack generated locally with Web Audio.
- Adaptive tone for Story, Holonet, Combat, Dogfight, Ship, and danger.
- Automatic music ducking while NPCs speak.
- Device text-to-speech for Dren, Nera Kade, Renn, Jessa, and unknown Holonet contacts.
- Separate music/voice toggles and volume controls under Settings.
- No paid service, streaming audio, or network connection required for the music layer.
