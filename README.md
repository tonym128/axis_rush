# AXIS RUSH 2026

**Axis Rush 2026** is a high-speed, futuristic arcade racing game built with Three.js. Inspired by classics like *F-Zero* and *Wipeout*, it features a unique cylindrical track mechanic where racers can switch between the interior and exterior of the tube.

## 🚀 Key Features

- **Inside/Outside Transition:** Toggle between the interior and exterior of the cylindrical track for tactical advantages.
- **Slippery Steering:** An advanced angular velocity system providing a high-inertia "drift" feel.
- **Dynamic Physics:** Vehicle-to-vehicle collisions, slipstreaming (15% speed boost), and interactive track obstacles.
- **9 Unique Pilots:** Each with distinct background stories, signature colors, and high-performance crafts.
- **10 Dynamic Tracks:** Maps ranging from simple loops to complex "Quantum Knots."
- **Procedural Graphics:** Runtime-generated GLSL textures for tracks and environments using [TexGenJS](https://github.com/tonym128/texgen).
- **Audio Engine:** Custom Web Audio API-based "thumping techno" generator.

## 🎮 Controls

| Action | Keyboard | Gamepad |
| :--- | :--- | :--- |
| **Accelerate** | Arrow Up | Button A |
| **Steer** | Arrow Left / Right | Left Stick |
| **Brake** | Arrow Down | Button B |
| **Switch Side** | Spacebar | Button X |
| **Fire Weapon** | Q Key | Button Y |
| **Manual Boost** | W Key | Button RB |
| **Rear View** | E Key (Hold) | - |

## 🛠️ Technical Stack

- **Rendering:** [Three.js](https://threejs.org/)
- **Visual Effects:** [Postprocessing](https://github.com/vanruesc/postprocessing) (Motion blur, Chromatic aberration)
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

- `main.js`: Central Game class orchestrating the race loop, UI, and camera.
- `vehicle.js`: Physics and AI logic for the racers.
- `track.js`: Procedural track generation and item placement.
- `textures.js`: GLSL-based procedural texture management.
- `audio.js`: Web Audio API synthesizer for the soundtrack.
- `weapons.js`: Logic for missiles, oil slicks, and barrels.

---
*Created for the 2026 Axis Protocol.*
