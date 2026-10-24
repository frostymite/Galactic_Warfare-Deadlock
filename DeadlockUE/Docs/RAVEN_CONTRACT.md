# Raven / ShipForge actor contract
The Raven is one persistent logical ship and one reusable actor class.
Canonical attachment sockets: SF_Core, SF_Cockpit, SF_Wing, SF_Engine, SF_Weapon, SF_Cargo, SF_Utility.
Each ShipPart PrimaryDataAsset supplies slot, mesh, optional required socket, compatible classes, tier and stats.
Changing a part replaces that slot's mesh component; hangar, flight and cinematic scenes use the same loadout.
UE-1 may add paired sockets (left/right wings, engines, weapons) without changing the save identity of the slot.
