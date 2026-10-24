#pragma once
#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "DeadlockCharacterPresentation.generated.h"
USTRUCT(BlueprintType) struct FDeadlockEquipmentSocket{GENERATED_BODY()
 UPROPERTY(EditAnywhere,BlueprintReadOnly) FName EquipmentId;UPROPERTY(EditAnywhere,BlueprintReadOnly) FName SocketName;UPROPERTY(EditAnywhere,BlueprintReadOnly) TSoftObjectPtr<UStaticMesh> Mesh;
};
UCLASS(BlueprintType) class DEADLOCKUE_API UDeadlockCharacterPresentation:public UPrimaryDataAsset{GENERATED_BODY() public:
 UPROPERTY(EditAnywhere,BlueprintReadOnly) FName CharacterId;
 UPROPERTY(EditAnywhere,BlueprintReadOnly) TSoftObjectPtr<USkeletalMesh> BodyMesh;
 UPROPERTY(EditAnywhere,BlueprintReadOnly) TSoftClassPtr<UAnimInstance> AnimationBlueprint;
 UPROPERTY(EditAnywhere,BlueprintReadOnly) TArray<FName> MaterialSlots;
 UPROPERTY(EditAnywhere,BlueprintReadOnly) TArray<FDeadlockEquipmentSocket> Equipment;
 UPROPERTY(EditAnywhere,BlueprintReadOnly) TMap<FName,FName> ExpressionCurves;
 UPROPERTY(EditAnywhere,BlueprintReadOnly) int32 MobileTriangleBudgetLOD0=70000;
 UPROPERTY(EditAnywhere,BlueprintReadOnly) int32 MobileTriangleBudgetLOD1=35000;
 UPROPERTY(EditAnywhere,BlueprintReadOnly) int32 MobileTriangleBudgetLOD2=15000;
};