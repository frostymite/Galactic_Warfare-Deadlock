#include "DeadlockGameInstance.h"
#include "Kismet/GameplayStatics.h"

void UDeadlockGameInstance::Init(){Super::Init();if(!LoadCampaign())NewCampaign();}
void UDeadlockGameInstance::SeedDefaults(){
 if(!Campaign)return;
 Campaign->Player.CharacterId=TEXT("rovan_kes");Campaign->Player.DisplayName=TEXT("Rovan Kes");Campaign->Player.Callsign=TEXT("Deadlock");
 Campaign->Raven.ShipId=TEXT("raven");Campaign->Raven.ShipName=TEXT("The Raven");
 Campaign->Raven.InstalledParts={{TEXT("core"),TEXT("core_twinboom_09")},{TEXT("cockpit"),TEXT("cockpit_armored_05")},{TEXT("wing"),TEXT("wing_outrigger_09")},{TEXT("engine"),TEXT("engine_military_06")},{TEXT("weapon"),TEXT("weapon_rotary_09")},{TEXT("cargo"),TEXT("cargo_modular_08")},{TEXT("utility"),TEXT("utility_smuggler_06")}};
 Campaign->World.CurrentLocation=TEXT("blackglass_station");Campaign->World.DiscoveredLocations={TEXT("blackglass_station")};
}
void UDeadlockGameInstance::NewCampaign(){Campaign=Cast<UDeadlockSaveGame>(UGameplayStatics::CreateSaveGameObject(UDeadlockSaveGame::StaticClass()));SeedDefaults();}
bool UDeadlockGameInstance::SaveCampaign(){return Campaign&&UGameplayStatics::SaveGameToSlot(Campaign,SaveSlot,0);}
bool UDeadlockGameInstance::LoadCampaign(){if(!UGameplayStatics::DoesSaveGameExist(SaveSlot,0))return false;Campaign=Cast<UDeadlockSaveGame>(UGameplayStatics::LoadGameFromSlot(SaveSlot,0));return Campaign!=nullptr;}
