# Deadlock v9.3 — Interactive Consequence Layer

## Agency fixes
- Marr choices are explicitly bound to the Marr contract.
- Kade choices can be bound to Kade; random contract selection happens only for generic bounty searches.
- successful investigations change the actual contract progress percentage
- failed checks do not fake progress; they increase pressure instead
- investigation-generated progress caps at 95%, preventing accidental contract completion
- target intel/status changes at 50%, 75%, and 90% progress

## Ship repairs
- repair choices carry the actual `systemId`
- successful Technical repairs change that system's condition
- critical successes repair more
- failed repairs can make the damaged system slightly worse

## Interruptions
- random complications use a separate interruption queue
- interruptions never erase current dialogue/mission choices
- up to two current interruptions can remain visible
- resolving one removes only that interruption

## Interactive Consequence Layer — Phase 1
Persistent consequences now affect:
- contract progress
- target intel and target status
- ship system condition
- NPC trust / respect / irritation / fear
- caught-lie memory
- Holonet rapport / pressure
- Reliability and Underworld reputation
- active contract thread
- recent consequence HUD
