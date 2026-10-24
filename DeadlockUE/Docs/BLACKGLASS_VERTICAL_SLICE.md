# Blackglass vertical slice
Playable loop: spawn as Rovan -> move/look -> approach NPC/terminal -> Interact trace -> dialogue/terminal event -> cinematic HUD -> save state -> approach Raven.
Target level: /Game/Maps/L_Blackglass_Prototype.
GameMode: /Script/DeadlockUE.DeadlockGameMode.
First authored actors: BP_Rovan, BP_BlackglassNPC, BP_CommandTerminal, BP_Raven.
First UI: WBP_CinematicHUD, WBP_DialogueOverlay, WBP_InteractionPrompt.
The environment should be scene-first: UI overlays the world rather than replacing it with dashboard panels.
