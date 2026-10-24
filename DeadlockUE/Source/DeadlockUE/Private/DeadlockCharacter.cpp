#include "DeadlockCharacter.h"
#include "DeadlockInteraction.h"
#include "Camera/CameraComponent.h"
#include "GameFramework/SpringArmComponent.h"
#include "Engine/World.h"
ADeadlockCharacter::ADeadlockCharacter(){PrimaryActorTick.bCanEverTick=false;CameraBoom=CreateDefaultSubobject<USpringArmComponent>(TEXT("CameraBoom"));CameraBoom->SetupAttachment(RootComponent);CameraBoom->TargetArmLength=320.f;CameraBoom->bUsePawnControlRotation=true;FollowCamera=CreateDefaultSubobject<UCameraComponent>(TEXT("FollowCamera"));FollowCamera->SetupAttachment(CameraBoom);FollowCamera->bUsePawnControlRotation=false;}
void ADeadlockCharacter::TryInteract(){if(!GetWorld())return;FVector S=FollowCamera->GetComponentLocation(),E=S+FollowCamera->GetForwardVector()*InteractionRange;FHitResult H;FCollisionQueryParams Q(SCENE_QUERY_STAT(DeadlockInteract),false,this);if(GetWorld()->LineTraceSingleByChannel(H,S,E,ECC_Visibility,Q)&&H.GetActor()&&H.GetActor()->GetClass()->ImplementsInterface(UDeadlockInteractable::StaticClass()))IDeadlockInteractable::Execute_Interact(H.GetActor(),this);}
