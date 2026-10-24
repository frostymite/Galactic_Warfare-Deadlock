#include "DeadlockLegacyImporter.h"
#include "Serialization/JsonSerializer.h"
#include "Dom/JsonObject.h"
bool UDeadlockLegacyImporter::ImportLegacyJson(const FString& Json,UDeadlockSaveGame* T,FString& E){
 if(!T){E=TEXT("No target save supplied.");return false;}TSharedPtr<FJsonObject> R;const TSharedRef<TJsonReader<>> Reader=TJsonReaderFactory<>::Create(Json);
 if(!FJsonSerializer::Deserialize(Reader,R)||!R.IsValid()){E=TEXT("Invalid Legacy JSON.");return false;}
 const TSharedPtr<FJsonObject>* P=nullptr;if(R->TryGetObjectField(TEXT("player"),P)&&P&&P->IsValid()){FString V;if((*P)->TryGetStringField(TEXT("id"),V))T->Player.CharacterId=*V;if((*P)->TryGetStringField(TEXT("name"),V))T->Player.DisplayName=V;if((*P)->TryGetStringField(TEXT("callsign"),V))T->Player.Callsign=V;}
 const TSharedPtr<FJsonObject>* S=nullptr;if(R->TryGetObjectField(TEXT("ship"),S)&&S&&S->IsValid()){FString V;if((*S)->TryGetStringField(TEXT("id"),V))T->Raven.ShipId=*V;if((*S)->TryGetStringField(TEXT("name"),V))T->Raven.ShipName=V;}
 const TSharedPtr<FJsonObject>* F=nullptr;if(R->TryGetObjectField(TEXT("faction"),F)&&F&&F->IsValid()){FString V;if((*F)->TryGetStringField(TEXT("hq"),V))T->World.CurrentLocation=*V;}
 E.Empty();return true;
}