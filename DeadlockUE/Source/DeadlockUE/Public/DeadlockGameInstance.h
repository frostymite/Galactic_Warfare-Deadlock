#pragma once
#include "CoreMinimal.h"
#include "Engine/GameInstance.h"
#include "DeadlockSaveGame.h"
#include "DeadlockGameInstance.generated.h"

UCLASS()
class DEADLOCKUE_API UDeadlockGameInstance : public UGameInstance {
 GENERATED_BODY()
public:
 virtual void Init() override;
 UFUNCTION(BlueprintCallable,Category="Deadlock|Save") bool SaveCampaign();
 UFUNCTION(BlueprintCallable,Category="Deadlock|Save") bool LoadCampaign();
 UFUNCTION(BlueprintCallable,Category="Deadlock|Save") void NewCampaign();
 UFUNCTION(BlueprintPure,Category="Deadlock|Save") UDeadlockSaveGame* GetCampaign() const { return Campaign; }
 UPROPERTY(EditAnywhere,BlueprintReadWrite,Category="Deadlock|Save") FString SaveSlot=TEXT("DeadlockCampaign");
private:
 UPROPERTY() TObjectPtr<UDeadlockSaveGame> Campaign;
 void SeedDefaults();
};