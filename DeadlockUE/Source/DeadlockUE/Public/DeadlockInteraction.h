#pragma once
#include "CoreMinimal.h"
#include "UObject/Interface.h"
#include "DeadlockInteraction.generated.h"
UINTERFACE(BlueprintType) class UDeadlockInteractable:public UInterface{GENERATED_BODY()};
class DEADLOCKUE_API IDeadlockInteractable{GENERATED_BODY() public:
 UFUNCTION(BlueprintNativeEvent,BlueprintCallable,Category="Deadlock|Interaction") FText InteractionLabel()const;
 UFUNCTION(BlueprintNativeEvent,BlueprintCallable,Category="Deadlock|Interaction") void Interact(AActor* InstigatorActor);
};