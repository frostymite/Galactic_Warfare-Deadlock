#pragma once
#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "DeadlockPlayerController.generated.h"
class UInputMappingContext; class UInputAction; class ADeadlockCharacter;
UCLASS() class DEADLOCKUE_API ADeadlockPlayerController:public APlayerController{GENERATED_BODY() public:
 virtual void BeginPlay()override; virtual void SetupInputComponent()override;
 UPROPERTY(EditDefaultsOnly,Category="Input") TObjectPtr<UInputMappingContext> GameplayContext;
 UPROPERTY(EditDefaultsOnly,Category="Input") TObjectPtr<UInputAction> MoveAction;
 UPROPERTY(EditDefaultsOnly,Category="Input") TObjectPtr<UInputAction> LookAction;
 UPROPERTY(EditDefaultsOnly,Category="Input") TObjectPtr<UInputAction> InteractAction;
protected: void Move(const struct FInputActionValue& V);void Look(const struct FInputActionValue& V);void Interact();
};