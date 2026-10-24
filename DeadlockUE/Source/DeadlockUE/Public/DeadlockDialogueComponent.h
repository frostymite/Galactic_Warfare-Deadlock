#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "DeadlockDialogueComponent.generated.h"
USTRUCT(BlueprintType) struct FDeadlockDialogueLine{GENERATED_BODY()
 UPROPERTY(EditAnywhere,BlueprintReadWrite) FName SpeakerId;UPROPERTY(EditAnywhere,BlueprintReadWrite) FText Text;
 UPROPERTY(EditAnywhere,BlueprintReadWrite) FName Emotion=TEXT("Neutral");UPROPERTY(EditAnywhere,BlueprintReadWrite) TArray<FName> Choices;
};
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FDeadlockDialogueEvent,const FDeadlockDialogueLine&,Line);
UCLASS(ClassGroup=(Deadlock),meta=(BlueprintSpawnableComponent)) class DEADLOCKUE_API UDeadlockDialogueComponent:public UActorComponent{GENERATED_BODY() public:
 UPROPERTY(BlueprintAssignable) FDeadlockDialogueEvent OnDialogue;
 UFUNCTION(BlueprintCallable) void PresentLine(const FDeadlockDialogueLine& Line){Current=Line;OnDialogue.Broadcast(Current);}
 UFUNCTION(BlueprintPure) FDeadlockDialogueLine CurrentLine()const{return Current;}
private:UPROPERTY() FDeadlockDialogueLine Current;
};