# Deadlock v9.3 — Interactive Consequence Layer QA

Result: PASS
Errors: 0

## Major fixes
- Marr binding / real progress: {'before': {'m': 35, 'k': 20}, 'after': {'m': 47, 'k': 20, 'active': 'marr'}}
- Real subsystem repair: {'choice': {'id': 'choice_mvbx6lyt_nw5v3', 'label': 'Repair Short-Burst Shield Overcharge before departure.', 'intent': 'ship', 'actionType': 'repair', 'systemId': 'overcharge', 'skill': 'Technical', 'dc': 12}, 'before': 60, 'after': 74}
- Interruption preservation and isolation: {'baseline': ['Re-run diagnostics on Short-Burst Shield Overcharge.', 'Repair Short-Burst Shield Overcharge.', 'Launch now and accept the remaining risk.', 'Call Jessa and ask for a second opinion.'], 'during': {'choices': ['Re-run diagnostics on Short-Burst Shield Overcharge.', 'Repair Short-Burst Shield Overcharge.', 'Launch now and accept the remaining risk.', 'Call Jessa and ask for a second opinion.'], 'n': 1}, 'after': {'choices': ['Re-run diagnostics on Short-Burst Shield Overcharge.', 'Repair Short-Burst Shield Overcharge.', 'Launch now and accept the remaining risk.', 'Call Jessa and ask for a second opinion.'], 'n': 0, 'drenLines': 0, 'flag': True}}
- Failed NPC deception consequence: {'before': {'t': 50, 'i': 32}, 'after': {'t': 46, 'i': 38, 'm': True}}
- Contract-linked deception routing: {'p': 60, 'd': 1}
- Contract thresholds: {'a': {'p': 52, 'intel': ['Recovery contract active', 'Rovan plans to split the payout with Dren Voss', 'The target trail narrowed after active field investigation.']}, 'b': {'p': 77, 'status': 'Trail Narrowed / Wanted Alive'}, 'd': {'p': 92, 'status': 'Located / Wanted Alive', 'flag': True}}

## Play test
- 24-turn random session: {'turns': 24, 'marr_start': 35, 'marr_end': 63, 'kade_start': 20, 'kade_end': 20, 'danger_min': 22, 'danger_max': 42, 'max_interruptions': 1, 'effects_final': 12, 'dren_trust_final': 60}
- Fold sequence: [{'w': 393, 'h': 873, 'badge': 'PHONE', 'ov': 0}, {'w': 744, 'h': 828, 'badge': 'UNFOLDED', 'ov': 0}, {'w': 744, 'h': 460, 'badge': 'FLEX', 'ov': 0}, {'w': 828, 'h': 744, 'badge': 'UNFOLDED', 'ov': 0}, {'w': 393, 'h': 873, 'badge': 'PHONE', 'ov': 0}]

## Errors
- None
