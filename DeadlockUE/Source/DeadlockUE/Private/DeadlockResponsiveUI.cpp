#include "DeadlockResponsiveUI.h"
EDeadlockLayoutMode UDeadlockResponsiveUI::EvaluateLayout(FVector2D S){const float A=S.Y>0?S.X/S.Y:1.f;EDeadlockLayoutMode N;
 if(S.X>=1200&&S.Y>=900)N=EDeadlockLayoutMode::Tablet;
 else if(A>=1.25f)N=S.X>=900?EDeadlockLayoutMode::FoldLandscape:EDeadlockLayoutMode::PhoneLandscape;
 else N=S.X>=700?EDeadlockLayoutMode::FoldPortrait:EDeadlockLayoutMode::PhonePortrait;
 if(N!=CurrentMode){CurrentMode=N;OnLayoutChanged.Broadcast(N);}return CurrentMode;}