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

## Deployment Automático en GitHub Pages

Este proyecto está configurado para desplegarse automáticamente en GitHub Pages cada vez que se hace push a la rama `main` o `master`.

### Configuración inicial (solo una vez)

1. **Habilitar GitHub Pages en tu repositorio:**
   - Ve a Settings > Pages
   - En "Source", selecciona "GitHub Actions"
   - Guarda los cambios

2. **Hacer push del workflow:**
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Configurar deploy automático a GitHub Pages"
   git push
   ```

3. **¡Listo!** El workflow se ejecutará automáticamente y tu sitio estará disponible en:
   - Si tu repositorio es `usuario.github.io`: `https://usuario.github.io`
   - Si tu repositorio tiene nombre: `https://usuario.github.io/nombre-del-repo`

### Cómo funciona

- Cada vez que haces push a `main` o `master`, el workflow automáticamente:
  1. Instala las dependencias
  2. Construye el proyecto
  3. Despliega a GitHub Pages

- También puedes activar el deploy manualmente desde la pestaña "Actions" en GitHub.

- No necesitas mantener nada manualmente, todo es automático.

## Version

v1.0.0