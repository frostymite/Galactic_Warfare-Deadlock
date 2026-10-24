#include "DeadlockPlayerController.h"
#include "DeadlockCharacter.h"
#include "EnhancedInputComponent.h"
#include "EnhancedInputSubsystems.h"
#include "InputActionValue.h"
void ADeadlockPlayerController::BeginPlay(){Super::BeginPlay();if(ULocalPlayer* L=GetLocalPlayer())if(auto* S=L->GetSubsystem<UEnhancedInputLocalPlayerSubsystem>())if(GameplayContext)S->AddMappingContext(GameplayContext,0);}
void ADeadlockPlayerController::SetupInputComponent(){Super::SetupInputComponent();if(auto* E=Cast<UEnhancedInputComponent>(InputComponent)){if(MoveAction)E->BindAction(MoveAction,ETriggerEvent::Triggered,this,&ADeadlockPlayerController::Move);if(LookAction)E->BindAction(LookAction,ETriggerEvent::Triggered,this,&ADeadlockPlayerController::Look);if(InteractAction)E->BindAction(InteractAction,ETriggerEvent::Started,this,&ADeadlockPlayerController::Interact);}}
void ADeadlockPlayerController::Move(const FInputActionValue& V){auto* C=Cast<ADeadlockCharacter>(GetPawn());if(!C)return;FVector2D A=V.Get<FVector2D>();const FRotator R(0,GetControlRotation().Yaw,0);C->AddMovementInput(FRotationMatrix(R).GetUnitAxis(EAxis::X),A.Y);C->AddMovementInput(FRotationMatrix(R).GetUnitAxis(EAxis::Y),A.X);}
void ADeadlockPlayerController::Look(const FInputActionValue& V){FVector2D A=V.Get<FVector2D>();AddYawInput(A.X);AddPitchInput(A.Y);}
void ADeadlockPlayerController::Interact(){if(auto* C=Cast<ADeadlockCharacter>(GetPawn()))C->TryInteract();}
