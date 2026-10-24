# Input and responsive UI contract
Enhanced Input is the input layer. UE-1 will create IMC_Gameplay, IMC_UI and touch actions in-editor.
Gameplay actions: Move, Look, Interact, PrimaryAction, SecondaryAction, OpenCommand, Back.
Touch UI must not own gameplay state; it invokes the same actions used by controller/keyboard.
Responsive UMG reacts to EDeadlockLayoutMode. No critical control may use absolute screen coordinates.
The foldable breakpoint is intentionally presentation-only: changing posture/aspect never resets a conversation, encounter or menu state.
