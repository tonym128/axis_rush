# AXIS RUSH 2026 - Project Documentation

## Project Overview
**Axis Rush 2026** is a high-speed, futuristic arcade racing game in the vein of *F-Zero* and *Wipeout*. The core gameplay mechanic involves racing along a cylindrical track, with the ability to transition between the **inside** and **outside** of the cylinder for tactical advantages.

### Current Project Status (March 2026)
- **Core Loop:** Fully implemented including race logic, lap timing, and finishing positions.
- **Progression:** Integrated `League Mode` with a persistent credit system and `Upgrade Shop`.
- **Narrative:** 9 unique pilots with full backstories, character-specific intro/outro cinematics, and randomized in-race dialog.
- **Audio:** Custom Web Audio procedural techno engine supplemented with a full suite of sound effects (boost, collision, weapons).
- **Mobile Support:** Functional but currently experiencing UI scaling issues in the selection screens.

### Core Technologies
- **Rendering:** [Three.js](https://threejs.org/) for 3D graphics and world management.
- **Procedural Graphics:** [TexGenJS](https://github.com/tonym128/texgen) for runtime-generated GLSL textures based on descriptive words.
- **Visual Effects:** [Postprocessing](https://github.com/vanruesc/postprocessing) for motion blur, chromatic aberration, and pixelation.
- **Audio Engine:** Custom Web Audio API-based techno soundtrack generator + SFX manager.
- **Build System:** [Vite](https://vitejs.dev/) for development and asset bundling.

### Architecture
- `main.js`: The central `Game` class orchestrating the race loop, UI screens, pilot data persistence, and camera logic.
- `vehicle.js`: Contains the `Vehicle` and `AI` classes, managing physics, slippery steering, collisions, and visual effects like trails and slipstreams.
- `track.js`: Manages the `Track` generation, curve geometry, and placement of items (boosts, weapons, obstacles).
- `textures.js`: A `TextureManager` that maps natural language words to GLSL shaders for baking procedural textures.
- `audio.js`: A code-generated "thumping techno" engine and SFX system.

## Game Features

### Gameplay Mechanics
- **Inside/Outside Transition:** Toggle between the interior and exterior of the track using the `Space` bar. Steering is dynamically inverted while inside for intuitive control.
- **Upgrade Shop:** Use credits earned in League Mode to improve vehicle **Speed**, **Handling**, and **Armor** (max energy).
- **Slippery Steering:** Advanced angular velocity system providing a high-inertia "drift" feel.
- **Slipstreaming:** Drafting behind other racers grants a 15% speed boost with "wind line" visual effects.
- **Dynamic Physics:** Includes vehicle-to-vehicle collisions with physical push-back and speed penalties.

### Pilot & Track Selection
- **9 Unique Pilots:** Each has a background story and signature color. Campaign progress is tracked per-pilot.
- **10 Dynamic Tracks:** Ranging from simple loops to complex knots. Tracks are unlocked sequentially in League Mode.
- **Difficulty Levels:** NOVICE, PRO, and ELITE modes affecting speed, damage, and AI aggression.

### HUD & UI
- **3D Minimap:** A top-down viewport in the bottom-left showing all racer positions and the full track geometry.
- **Integrated Stats:** Real-time display of LAP, POS, WEAPON, and SPEED on the left side.
- **Cinematic Camera:** Automatic "zoom-in" effect during the race countdown and dynamic FOV warping at high speeds.

## Known Issues
- **Mobile UI:** Character selection and story dialog boxes may be clipped on smaller screens or specific aspect ratios.
- **AI Tactics:** AI currently follows pre-defined paths and does not actively choose inside/outside transitions for tactical advantage.

## Development Conventions
- **Rendering Layers:** Layer 0 for the main world. Layer 1 for minimap-only markers.
- **Procedural Dictionary:** New texture styles should be added to the `WORDS` dictionary in `textures.js` as GLSL fragments.
- **Collision Logic:** Uses T-space (progress along the spline) and Angle-space (rotation around the tube) for efficient 2D collision detection on a cylinder.
