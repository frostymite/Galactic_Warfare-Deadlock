# Offline Director Design

## Core loop

PLAYER ACTION
↓
intent detection
↓
optional skill check
↓
NPC / contract / ship / action reaction
↓
relationship + memory update
↓
weighted encounter check
↓
narration + dialogue
↓
3–5 procedural choices
↓
persistent campaign save

## Director state

The director stores:
- turn
- tension
- cooldown
- last event
- active threads
- last topic
- last NPC
- generated canon event count

This state makes the random generator feel less like unrelated random tables.

## Dialogue layers

NPC response =
voice profile
+ current mood
+ trust/respect/irritation
+ memory callback chance
+ conversation topic
+ scene context

## Offline continuity

Everything is stored in:
- localStorage
- exported JSON campaign saves

The service worker caches the game shell so the app launches without a network after installation.

## Optional AI

AI is deliberately outside the core loop.
Losing connectivity never prevents local story generation.
