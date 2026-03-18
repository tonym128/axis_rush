# AXIS RUSH 2026

**Axis Rush 2026** is a high-speed, futuristic arcade racing game built with Three.js. Inspired by classics like *F-Zero* and *Wipeout*, it features a unique cylindrical track mechanic where racers can switch between the interior and exterior of the tube.

🔗 **[Live Demo](https://tonym128.github.io/axis_rush/)** | 📂 **[GitHub Repository](https://github.com/tonym128/axis_rush)**

## 🚀 Key Features

- **Inside/Outside Transition:** Toggle between the interior and exterior of the cylindrical track with the `Space` bar for tactical advantages.
- **League Mode & Progression:** Compete across 10 dynamic tracks, earn credits based on performance, and unlock new challenges.
- **Upgrade Shop:** Invest earned credits into permanent vehicle improvements for **Speed**, **Handling**, and **Armor**.
- **Narrative Experience:** 9 unique pilots, each with character-specific intro/outro cinematics and randomized in-race dialog.
- **Slippery Steering:** An advanced angular velocity system providing a high-inertia "drift" feel.
- **Dynamic Physics:** Vehicle-to-vehicle collisions, slipstreaming (15% speed boost), and interactive track obstacles.
- **Advanced HUD:** A real-time 3D minimap showing all racer positions and the full track geometry.
- **Procedural Graphics:** Runtime-generated GLSL textures for tracks and environments using [TexGenJS](https://github.com/tonym128/texgen).
- **Techno Engine & SFX:** A custom Web Audio API-based "thumping techno" generator and a full suite of reactive sound effects.
- **Difficulty Settings:** Choose between **Novice**, **Pro**, and **Elite** modes to match your skill level.

## 🎮 Controls

| Action | Keyboard | Gamepad |
| :--- | :--- | :--- |
| **Accelerate** | Arrow Up / W | Button A |
| **Steer** | Arrow Left / Right / A / D | Left Stick |
| **Brake / Reverse** | Arrow Down / S | Button B |
| **Switch Side** | Spacebar | Button X |
| **Fire Weapon** | Q Key | Button Y |
| **Manual Boost** | W Key | Button RB |
| **Rear View** | E Key (Hold) | - |

## 🛠️ Technical Stack

- **Rendering:** [Three.js](https://threejs.org/)
- **Visual Effects:** [Postprocessing](https://github.com/vanruesc/postprocessing) (Motion blur, Chromatic aberration, Pixelation)
- **Procedural Textures:** [TexGenJS](https://github.com/tonym128/texgen)
- **Build System:** [Vite](https://vitejs.dev/)

## 🛠️ Development Setup

### Installation
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📂 Project Architecture

- `main.js`: Central Game class orchestrating the race loop, UI screens, pilot data persistence, and camera logic.
- `vehicle.js`: Physics and AI logic for the racers, handling angular velocity and collisions.
- `track.js`: Procedural track generation using 3D splines and dynamic item placement.
- `textures.js`: GLSL-based procedural texture management and baking.
- `audio.js`: Web Audio API synthesizer for the soundtrack and SFX management.
- `weapons.js`: Logic for missiles, oil slicks, and barrels.

---
*Created for the 2026 Axis Protocol.*
