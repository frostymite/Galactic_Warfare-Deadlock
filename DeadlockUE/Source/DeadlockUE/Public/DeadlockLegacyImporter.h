#pragma once
#include "CoreMinimal.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "DeadlockSaveGame.h"
#include "DeadlockLegacyImporter.generated.h"
UCLASS() class DEADLOCKUE_API UDeadlockLegacyImporter:public UBlueprintFunctionLibrary{GENERATED_BODY() public:
 UFUNCTION(BlueprintCallable,Category="Deadlock|Migration") static bool ImportLegacyJson(const FString& Json,UDeadlockSaveGame* Target,FString& Error);
};