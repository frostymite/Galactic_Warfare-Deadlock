# Deadlock 3D Character Pipeline — Rovan first

## Canonical character contract
Every major character is a skeletal mesh driven by a CharacterPresentation PrimaryDataAsset.
Required presentation hooks:
- body skeletal mesh
- shared humanoid skeleton where anatomy permits
- Animation Blueprint
- facial/expression curve map
- material slots for skin, armor, cloth and emissive accents
- equipment sockets
- authored LOD chain
- collision capsule / physics asset

## Rovan Kes / Deadlock
Visual identity: changeling/Clawdite, diagonal facial scar, obsidian armor, electric-cyan emissive accents.
Equipment sockets:
- Blackwake: weapon_back / hand_r
- Luna: holster_l / hand_l
- Sol: holster_r / hand_r
Armor must be modular enough for later equipment progression without replacing the underlying character actor.

## Animation layers
Locomotion base: idle, walk, jog, turn, crouch.
Upper-body layer: pistol, dual pistol, Blackwake, terminal interaction.
Conversation layer: look-at, gesture, emotional idle, facial curves.
Cinematic layer: Sequencer may temporarily drive camera/body, but returns control to gameplay state.

## Mobile budgets
Start targets, profile on device rather than treating them as hard guarantees:
LOD0 ~70k triangles for hero close-up; LOD1 ~35k; LOD2 ~15k, with lower background LODs/impostor strategy where needed.
Use compressed textures/material instances and keep material slot count disciplined.

## Production route
1. Create/import neutral Rovan base skeletal mesh.
2. Bind/retarget to chosen humanoid skeleton.
3. Build obsidian/cyan armor as modular skinned/static pieces.
4. Add scar/face material details.
5. Create Blackwake/Luna/Sol meshes and sockets.
6. Create ABP_Rovan and locomotion blendspace.
7. Add expression curves and dialogue look-at.
8. Generate/test LODs using Mobile Preview and physical Android profiling.

Do not bake Rovan into Blackglass. The same actor/presentation asset must work in HQ, Lower Port, ships and cinematics.
