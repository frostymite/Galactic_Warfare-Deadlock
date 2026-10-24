# First launch and playtest — Unreal Engine 5.8

## Install
1. Install Unreal Engine 5.8 with the Epic Games Launcher. Include Android target platform support.
2. Install Visual Studio 2022 with Desktop development with C++ and Game development with C++ workloads.
3. Clone/pull this repository and enter DeadlockUE.
4. Right-click DeadlockUE.uproject and choose Generate Visual Studio project files.
5. Open DeadlockUE.sln and build the Development Editor / Win64 target, or open DeadlockUE.uproject and allow Unreal to compile the module.

## Android toolchain
In Unreal Editor choose Platforms > SDK Management > Android > Install SDK. UE 5.8 Turnkey installs the compatible Android toolchain. Accept Android licenses when prompted. Restart/login again if environment variables were changed.

## First editor-authored assets
The repository contains C++ systems, but Unreal binary .uasset content must now be authored/imported in the Editor.
1. Create /Game/Maps/L_Blackglass_Prototype and save it.
2. World Settings > GameMode Override: DeadlockGameMode.
3. Create Input Actions IA_Move (Axis2D), IA_Look (Axis2D), IA_Interact (Digital) and IMC_Gameplay.
4. Create BP_Rovan derived from DeadlockCharacter. Assign the input assets on the DeadlockPlayerController defaults (or a BP subclass).
5. Add a PlayerStart.
6. For the first graybox, use simple geometry for floor/walls and place lighting. Art replacement follows after movement/interaction works.
7. Create a test actor implementing DeadlockInteractable and call a DialogueComponent PresentLine from Interact.

## Play in editor
Open L_Blackglass_Prototype. Click Play. Verify:
- Rovan pawn spawns.
- movement/look work.
- interaction trace reaches the test actor.
- dialogue event fires.
- exiting/re-entering preserves campaign state through DeadlockGameInstance.

## Mobile preview
Use the Unreal Preview Platform / Mobile Preview to inspect mobile rendering and responsive UI before packaging.

## Test on Android
Enable Developer Options and USB debugging on the phone and connect it by USB. In Unreal Editor open Platforms. When the phone appears under Quick Launch Current Level, select it. Unreal cooks, installs and launches the current level on the device.

For a standalone build: Platforms > Package Project > Android, choose an Android texture format, then package. UE produces installable Android output in the selected folder.

## Fold testing
Test at minimum: folded portrait, unfolded portrait, unfolded landscape. Resize/rotate while dialogue is open and while the interaction prompt is visible. Gameplay state must persist while the responsive HUD rearranges.
