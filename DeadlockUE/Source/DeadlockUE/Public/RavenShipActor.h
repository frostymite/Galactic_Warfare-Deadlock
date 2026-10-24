#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "DeadlockDataAssets.h"
#include "RavenShipActor.generated.h"
UCLASS() class DEADLOCKUE_API ARavenShipActor:public AActor{GENERATED_BODY() public:
 ARavenShipActor();
 UFUNCTION(BlueprintCallable,Category="Raven|ShipForge") bool InstallPart(UDeadlockShipPartData* Part);
 UFUNCTION(BlueprintCallable,Category="Raven|ShipForge") void ClearSlot(EDeadlockShipSlot Slot);
 UFUNCTION(BlueprintPure,Category="Raven|ShipForge") FName SocketForSlot(EDeadlockShipSlot Slot)const;
protected: UPROPERTY(VisibleAnywhere) TObjectPtr<USceneComponent> Root;
 UPROPERTY(VisibleAnywhere) TMap<EDeadlockShipSlot,TObjectPtr<UStaticMeshComponent>> Components;
};