#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "DeadlockCharacter.generated.h"
class USpringArmComponent; class UCameraComponent;
UCLASS() class DEADLOCKUE_API ADeadlockCharacter:public ACharacter{GENERATED_BODY() public:
 ADeadlockCharacter();
 UFUNCTION(BlueprintCallable) void TryInteract();
 UPROPERTY(EditAnywhere,BlueprintReadWrite,Category="Interaction") float InteractionRange=350.f;
protected:
 UPROPERTY(VisibleAnywhere,BlueprintReadOnly) TObjectPtr<USpringArmComponent> CameraBoom;
 UPROPERTY(VisibleAnywhere,BlueprintReadOnly) TObjectPtr<UCameraComponent> FollowCamera;
};