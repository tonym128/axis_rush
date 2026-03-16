# AXIS RUSH 2026 - Project Documentation

## Project Overview
**Axis Rush 2026** is a high-speed, futuristic arcade racing game in the vein of *F-Zero* and *Wipeout*. The core gameplay mechanic involves racing along a cylindrical track, with the ability to transition between the **inside** and **outside** of the cylinder for tactical advantages.

### Core Technologies
- **Rendering:** [Three.js](https://threejs.org/) for 3D graphics and world management.
- **Procedural Graphics:** [TexGenJS](https://github.com/tonym128/texgen) for runtime-generated GLSL textures based on descriptive words.
- **Visual Effects:** [Postprocessing](https://github.com/vanruesc/postprocessing) for motion blur, chromatic aberration, and pixelation.
- **Audio Engine:** Custom Web Audio API-based techno soundtrack generator.
- **Build System:** [Vite](https://vitejs.dev/) for development and asset bundling.

### Architecture
- `main.js`: The central `Game` class orchestrating the race loop, UI screens, and camera logic.
- `vehicle.js`: Contains the `Vehicle` and `AI` classes, managing physics, slippery steering, collisions, and visual effects like trails and slipstreams.
- `track.js`: Manages the `Track` generation, curve geometry, and placement of items (boosts, weapons, obstacles).
- `textures.js`: A `TextureManager` that maps natural language words to GLSL shaders for baking procedural textures.
- `audio.js`: A code-generated "thumping techno" engine using oscillators and noise buffers.

## Building and Running

### Development
To start the development server with hot-reloading:
```bash
npm run dev
```

### Production Build
To bundle the project for production:
```bash
npm run build
```

### Preview Build
To preview the production build locally:
```bash
npm run preview
```

## Game Features

### Gameplay Mechanics
- **Inside/Outside Transition:** Toggle between the interior and exterior of the track using the `Space` bar. Note that steering is inverted while inside to maintain intuitive view-relative control.
- **Slippery Steering:** Advanced angular velocity system providing a high-inertia "drift" feel.
- **Slipstreaming:** Drafting behind other racers grants a 15% speed boost accompanied by a "wind line" visual effect.
- **Dynamic Physics:** Includes vehicle-to-vehicle collisions with physical push-back and speed penalties.
- **Power-ups:**
    - **Electric Boost Pads:** Taller, longer pads that provide speed bonuses with gradual decay.
    - **Weapon Crystals:** Floating items that grant missiles, oil slicks, or barrels (Fired with `Q`).
    - **Obstacle Crates:** Stationary objects that significantly slow down vehicles upon impact.

### Pilot & Track Selection
- **9 Unique Pilots:** Each has a background story and a signature color used for their craft's highlights and trails.
- **10 Dynamic Tracks:** Maps range from simple loops (Neon Tube) to extreme configurations (Quantum Knot).
- **League Mode:** A championship mode where players race across all tracks, earning points based on their finishing position.

### HUD & UI
- **3D Minimap:** A top-down viewport in the bottom-left showing all racer positions using layer-specific markers.
- **Integrated Stats:** Real-time display of LAP, POS, WEAPON, and SPEED on the left side.
- **Cinematic Camera:** Automatic "zoom-in" effect during the race countdown and dynamic FOV warping at high speeds.

## Development Conventions
- **Rendering Layers:** Layer 0 is for the main game world. Layer 1 is reserved for minimap-only markers (large spheres and start lines) to keep the main view clean.
- **Procedural Dictionary:** New texture styles should be added to the `WORDS` dictionary in `textures.js` as GLSL fragments.
- **Collision Logic:** Uses a combination of T-space (progress along the track curve) and Angle-space (rotation around the tube) for efficient collision detection on a cylinder.
