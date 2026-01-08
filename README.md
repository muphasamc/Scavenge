# Procedural Spider Walker

A physics-based procedural animation experiment featuring a multi-legged creature traversing uneven, procedurally generated terrain using Inverse Kinematics (IK).

## Features

- **Procedural Animation**: The spider's movement is entirely code-driven. No keyframes are used. Legs adapt to terrain height using raycasting logic and 2-bone IK solvers.
- **Inverse Kinematics**: Custom 3-DoF solver handling shoulder, elbow, and foot placement on uneven surfaces.
- **Organic Terrain Generation**: Uses domain warping and non-harmonic fractal noise to create wind-swept sand dunes.
- **Atmospheric Shaders**: Custom WebGL shaders for the sky gradients, sun heat distortion, and volumetric-style dust particles.
- **Biome System**: Fully configurable environment settings (Desert, Volcanic, Cyberpunk, etc.) with JSON export capabilities.

## Controls

- **Left Click**: Set navigation target (Spider will walk to point).
- **Right Click / Drag**: Rotate Camera.
- **Scroll**: Zoom In/Out.
- **UI Panel (Bottom Right)**: Open "Editor" to tweak physics, lighting, and atmosphere in real-time.
- **Biome Selector (Top Right)**: Switch between preset environments.

## Tech Stack

- **React Three Fiber (R3F)**: Declarative scene graph.
- **Three.js**: WebGL rendering engine.
- **TypeScript**: Type safety for complex physics math.
- **Tailwind CSS**: HUD and UI styling.

## Version

v1.0.0