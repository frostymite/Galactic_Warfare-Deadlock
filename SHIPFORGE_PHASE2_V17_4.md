# ShipForge Phase 2 Complete — v17.4.0

Deadlock v17.4.0 completes the browser/offline ShipForge gameplay layer while keeping the durable data engine-neutral for the planned native/Godot runtime.

## Persistent fleet records

Every durable ship uses `deadlock.shipforge.persistent-ship.v1`. A ship record stores its owner, class, seed, palette, markings, registry, exact installed component instance IDs, hull/shield/fuel state, component-derived stats, damage history, condition, and persistent identity key. The campaign holds these records under `DATA.shipForge` (`deadlock.shipforge.world.v1`), so normal JSON export/import carries the fleet automatically.

The Raven is migrated into this schema on load. Additional player-owned ships use the same installation system and can be selected for management from the Ship page without replacing the active story craft.

## Component instances, condition, and damage

Catalog parts are definitions; owned parts are component instances. Each instance records the catalog part ID, owner, installed ship, condition from 0–100, acquisition source, paid price, notes, and damage history.

Hull-penetrating dogfight damage now degrades installed Raven components. Modular hostile ships also receive persistent component damage when hit. Condition directly reduces the effective contribution of armor, speed, power, damage, capacity, sensors, and utility while mass remains physical mass. Repairs restore component condition and charge credits according to part value and damage.

## Ship stats are live

Ship performance is calculated from installed components rather than display-only metadata. ShipForge derives hull capacity, shields, fuel capacity, attack modifier, evasion bonus, damage dice, cargo capability, effective speed, and ship value. The active ShipForge ship synchronizes these values into the existing Raven flight/dogfight state so old gameplay screens can keep working while using the new modular model.

Enemy dogfight hull, attack, damage, and handling come from their installed ShipForge components. Persistent damage therefore changes an NPC ship's later combat performance.

## Markets, salvage, and installation

Each visited location gets deterministic, save-persistent inventories for a new-component exchange and a salvage yard. Listings use each component's manufacturer, rarity, base credit value, condition, and market markup. Bought parts become owned component instances in the player's parts locker. Uninstalled owned parts can be sold.

The Ship page now includes a full ShipForge yard: three-quarter assembled ship preview, live derived stats, paint palettes, installed systems, component condition bars, repair actions, the parts locker, installation/removal controls, local market inventory, salvage claims, and the owned-ship registry.

Required systems cannot simply be removed; they must be replaced. Compatibility uses the existing ship-class, slot, and mount rules.

Defeated modular ships can produce recoverable component salvage. Salvage references the actual damaged component instance removed from the defeated ship, and claiming it transfers that same instance into the player's locker rather than creating a duplicate.

## Persistent NPC ships

Named/persistent NPC identities and repeated encounter sources receive deterministic ShipForge ships. The same identity key resolves to the same ship record on future encounters, including its parts, paint, accumulated component damage, missing salvaged systems, and condition-derived combat performance.

## Living modular traffic

General scene traffic and Lower Port flybys now request ships from the persistent ShipForge traffic population. Generated traffic stores ship IDs in the campaign and reuses the same assembled configurations instead of rerolling visual craft each render. First-seen traffic is saved immediately.

## Offline/native handoff

`runtime/shipforge-world.js` has no network dependency. Durable state is plain JSON and references catalog component IDs rather than browser DOM objects. This lets a future Godot implementation map the same IDs to native sprites, 2.5D scenes, or meshes without invalidating campaign ship records.

The service worker precaches the Phase 2 runtime/CSS and dynamically precaches all 64 component vectors from `ship-parts.json`.

## QA

- ShipForge component/generator suite: 8,502 checks
- Phase 2 world/economy/persistence suite: 39 checks
- Phase 2 application integration suite: 20 checks
- Procedural Lower Port engine suite: 26 checks, 100 worlds, 600 cases
- JavaScript syntax verification across runtime/tools/QA plus source and built app
