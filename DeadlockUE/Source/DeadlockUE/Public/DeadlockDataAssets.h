#pragma once
#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "DeadlockDataAssets.generated.h"

UENUM(BlueprintType) enum class EDeadlockShipSlot:uint8{Core,Cockpit,Wing,Engine,Weapon,Cargo,Utility};
UCLASS(BlueprintType) class DEADLOCKUE_API UDeadlockShipPartData:public UPrimaryDataAsset{GENERATED_BODY() public:
 UPROPERTY(EditAnywhere,BlueprintReadOnly) FName PartId; UPROPERTY(EditAnywhere,BlueprintReadOnly) FText DisplayName;
 UPROPERTY(EditAnywhere,BlueprintReadOnly) EDeadlockShipSlot Slot; UPROPERTY(EditAnywhere,BlueprintReadOnly) FName RequiredSocket;
 UPROPERTY(EditAnywhere,BlueprintReadOnly) TObjectPtr<UStaticMesh> Mesh; UPROPERTY(EditAnywhere,BlueprintReadOnly) int32 Tier=1;
 UPROPERTY(EditAnywhere,BlueprintReadOnly) TSet<FName> CompatibleClasses; UPROPERTY(EditAnywhere,BlueprintReadOnly) TMap<FName,float> Stats;
};
UCLASS(BlueprintType) class DEADLOCKUE_API UDeadlockCharacterData:public UPrimaryDataAsset{GENERATED_BODY() public:
 UPROPERTY(EditAnywhere,BlueprintReadOnly) FName CharacterId; UPROPERTY(EditAnywhere,BlueprintReadOnly) FText DisplayName;
 UPROPERTY(EditAnywhere,BlueprintReadOnly) TObjectPtr<USkeletalMesh> Mesh; UPROPERTY(EditAnywhere,BlueprintReadOnly) TSoftObjectPtr<UAnimInstance> AnimationClass;
 UPROPERTY(EditAnywhere,BlueprintReadOnly) TMap<FName,FText> Biography;
};
UCLASS(BlueprintType) class DEADLOCKUE_API UDeadlockLocationData:public UPrimaryDataAsset{GENERATED_BODY() public:
 UPROPERTY(EditAnywhere,BlueprintReadOnly) FName LocationId; UPROPERTY(EditAnywhere,BlueprintReadOnly) FText DisplayName;
 UPROPERTY(EditAnywhere,BlueprintReadOnly) TSoftObjectPtr<UWorld> Level; UPROPERTY(EditAnywhere,BlueprintReadOnly) TArray<FName> Tags;
};