# Changelog

## [1.1.0] - The "Electric Bogaloo" Update

### New Features
- **3 New Terrain Engines**:
  - **Glacial Flow**: Smooth, domain-warped ice sheets with sharp pressure ridges.
  - **Canyon Mesa**: High-verticality terraced terrain using cubic sine waves for cliffs.
  - **Bismuth Crystal**: Quantized, geometric block topology mimicking hopper crystals.
- **4 New Biomes**:
  - **Arctic Zero**: A frozen, blizzard-swept wasteland.
  - **Mars Canyon**: Red rock mesas with sedimentary layering.
  - **Bismuth Groves**: Neon, iridescent crystal constructs.
  - **Electric Bogaloo**: A wild, high-contrast toxic rave aesthetic.
- **Advanced Shaders**:
  - **Crystal Shader**: Implemented flat-shaded iridescence using custom Fresnel calculations and face-normal reconstruction.
  - **Canyon Shader**: Added procedural sedimentary banding and dust deposition logic.

### Bug Fixes
- **Shader Compilation**: Fixed `GL_FRAGMENT_PRECISION_HIGH` and variable redefinition errors in `CrystalMaterial` when using Flat Shading.
- **Performance**: Optimized terrain generation logic to ensure consistent framerates even with complex noise functions.

## [1.0.0] - Initial Release

### Features
- **IK Engine**: Implemented 2-bone Inverse Kinematics solver with constraints for natural insectoid movement.
- **Gait Controller**: Added "Tripod" gait scheduling to ensure stability while walking.
- **Procedural Terrain**: Implemented domain-warping noise algorithm for organic sand dunes.
- **Sand Shader**: Custom shader material with multi-layered noise for grain texture and wet/dry variation.
- **Dust System**: Added camera-centered infinite particulate system with soft fading and wind simulation.
- **UI Overlay**: Added HUD, Biome Selector, and comprehensive Configuration Panel.
- **Atmosphere**: Added day/night cycle support, sun positioning, and heat distortion shaders.
