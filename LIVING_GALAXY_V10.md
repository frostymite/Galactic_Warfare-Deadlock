# Deadlock v10 — Living Galaxy Foundation

## Navigation loop

`Plot course → review distance/fuel/risk → depart → transit event → continue transit → arrive in orbit → scan → dock/land → choose local site → Story scene`

Navigation state is deliberately separate from Story Mode location. A world does not become the active campaign scene just because it exists on the map. The player explicitly commits a location or launches a local-site scene.

## Starter network

Blackglass Station is the established home base in the Kaelor System. The starter navigation network also contains Veyra Prime, Drekthar, Nerath, Cindar, Talos, Orivon, Xerra, the Sable Belt, Thalos, Rethis, and Umber.

Except for Blackglass HQ, generated world details are gameplay/worldbuilding defaults. They become campaign facts through play and can be edited later.

## Travel state

`DATA.galaxyState` persists:

- home location
- Raven current navigation location
- selected destination
- route and transit state
- discovered and visited locations
- orbital scan count
- current HQ site
- travel log

Routes live in `galaxy-data.json`, allowing new systems and worlds to be added without hard-coding them into `app.js`.

## Local operations

Each destination can expose services and named sites. Once landed/docked, selecting a site starts a new Story scene at that location and explicitly establishes it in campaign play.
