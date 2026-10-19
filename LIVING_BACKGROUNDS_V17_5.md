# Living Backgrounds Runtime

`runtime/living-world.js` owns ambient population identity and background traffic choreography.

The renderer is deliberately split from durable state. A background person is stored as an identity record (species silhouette, role, home scene, movement seed and equipment), while the browser renderer turns that record into a lightweight articulated CSS rig. A future native renderer can map the same record to sprites, skeletal 2D actors or 3D models without changing the save.

Ship traffic follows the same rule. Persistent traffic records still come from ShipForge; Phase 3 only assigns scene choreography such as cruise, approach, landing and departure.

Performance mode scales population counts to roughly half and pauses ambient animation when the scene is not visible. Reduced-motion users get static scene population placement instead of looping movement.
