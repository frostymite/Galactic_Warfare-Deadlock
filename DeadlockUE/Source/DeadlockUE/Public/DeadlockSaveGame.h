#pragma once
#include "CoreMinimal.h"
#include "GameFramework/SaveGame.h"
#include "DeadlockGameTypes.h"
#include "DeadlockSaveGame.generated.h"
UCLASS(BlueprintType) class DEADLOCKUE_API UDeadlockSaveGame:public USaveGame{GENERATED_BODY() public: UPROPERTY(EditAnywhere,BlueprintReadWrite,SaveGame) int32 SaveVersion=1; UPROPERTY(EditAnywhere,BlueprintReadWrite,SaveGame) FDeadlockCharacterState Player; UPROPERTY(EditAnywhere,BlueprintReadWrite,SaveGame) FDeadlockShipLoadout Raven; UPROPERTY(EditAnywhere,BlueprintReadWrite,SaveGame) FDeadlockWorldState World; UPROPERTY(EditAnywhere,BlueprintReadWrite,SaveGame) TMap<FName,float> StoryFlags;};