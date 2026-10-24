#include "DeadlockGameMode.h"
#include "DeadlockCharacter.h"
#include "DeadlockPlayerController.h"
ADeadlockGameMode::ADeadlockGameMode(){DefaultPawnClass=ADeadlockCharacter::StaticClass();PlayerControllerClass=ADeadlockPlayerController::StaticClass();}