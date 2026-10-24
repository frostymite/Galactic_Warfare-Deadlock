#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "DeadlockResponsiveUI.generated.h"
UENUM(BlueprintType) enum class EDeadlockLayoutMode:uint8{PhonePortrait,PhoneLandscape,FoldPortrait,FoldLandscape,Tablet};
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FDeadlockLayoutChanged,EDeadlockLayoutMode,Mode);
UCLASS(ClassGroup=(Deadlock),meta=(BlueprintSpawnableComponent)) class DEADLOCKUE_API UDeadlockResponsiveUI:public UActorComponent{GENERATED_BODY() public:
 UPROPERTY(BlueprintAssignable) FDeadlockLayoutChanged OnLayoutChanged;
 UFUNCTION(BlueprintCallable) EDeadlockLayoutMode EvaluateLayout(FVector2D ViewportSize);
 UFUNCTION(BlueprintPure) EDeadlockLayoutMode GetLayoutMode()const{return CurrentMode;}
private: UPROPERTY() EDeadlockLayoutMode CurrentMode=EDeadlockLayoutMode::PhonePortrait;
};