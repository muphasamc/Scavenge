
import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, AdditiveBlending, Vector3 } from 'three';

interface DustParticlesProps {
  opacity: number;
  speed: number;
  count: number;
  radius: number;
  color: string;
}

/**
 * DUST PARTICLES (The "Atmosphere")
 * 
 * NOTE TO SELF: 
 * We don't spawn particles all over the map. That kills the GPU.
 * Instead, we spawn particles in a box *around the camera*.
 * 
 * As the camera moves, the particles WRAP around (Teleport).
 * If a particle exits the box on the left, it re-appears on the right.
 * This creates the illusion of an infinite field of dust using only 3000 points.
 */
export const DustParticles: React.FC<DustParticlesProps> = ({ opacity, speed, count, radius, color }) => {
  const pointsRef = useRef<any>(null);
  const geometryRef = useRef<any>(null);
  
  const MAX_COUNT = 10000;

  // Initialize Random Seeds
  const { positions, randoms } = useMemo(() => {
    const pos = new Float32Array(MAX_COUNT * 3);
    const rnd = new Float32Array(MAX_COUNT * 3);
    
    for (let i = 0; i < MAX_COUNT; i++) {
      // Base positions are just seeds. The shader does the positioning.
      pos[i * 3] = (Math.random() - 0.5) * 1000;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 1000; 
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1000;
      
      rnd[i * 3] = Math.random();     // Speed Variance
      rnd[i * 3 + 1] = Math.random(); // Size Variance
      rnd[i * 3 + 2] = Math.random(); // Phase Variance (Sway)
    }
    
    return { positions: pos, randoms: rnd };
  }, []);

  // Performance: Only draw what we need
  useEffect(() => {
    if (geometryRef.current) {
        geometryRef.current.setDrawRange(0, Math.min(count, MAX_COUNT));
    }
  }, [count]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new Color(color) },
    uOpacity: { value: opacity },
    uSpeed: { value: speed },
    uRadius: { value: radius },
    uCameraPos: { value: new Vector3() }
  }), []);

  // Update visual uniforms
  useEffect(() => {
    if (pointsRef.current) {
        pointsRef.current.material.uniforms.uColor.value.set(color);
        pointsRef.current.material.uniforms.uOpacity.value = opacity;
        pointsRef.current.material.uniforms.uSpeed.value = speed;
        pointsRef.current.material.uniforms.uRadius.value = radius;
    }
  }, [color, opacity, speed, radius]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
      pointsRef.current.material.uniforms.uCameraPos.value.copy(state.camera.position);
    }
  });

  // --- SHADER MAGIC ---
  const vertexShader = `
    uniform float uTime;
    uniform float uSpeed;
    uniform float uRadius;
    uniform vec3 uCameraPos;
    
    attribute vec3 aRandom;
    
    varying float vAlpha;
    
    void main() {
      // Define the "Active Box" size around the camera
      vec3 boxSize = vec3(uRadius * 2.0, uRadius * 1.5, uRadius * 2.0);
      
      // 1. Calculate Organic Motion
      // Downward gravity + Horizontal Sine wave sway
      vec3 velocity = vec3(0.0, -2.0, 0.0) * uSpeed * (0.5 + aRandom.x); 
      vec3 sway = vec3(
          sin(uTime * 0.4 + aRandom.z * 15.0), 
          0.0, 
          cos(uTime * 0.3 + aRandom.y * 15.0)
      ) * 1.5;

      vec3 localPos = position + (velocity * uTime) + sway;

      // 2. THE WRAP (Infinite Logic)
      // mod(position, boxSize) keeps the particle inside the box forever.
      // We subtract uCameraPos before modding so the box moves WITH the camera.
      vec3 relativePos = mod(localPos - uCameraPos, boxSize);
      
      // Center the box on the camera
      relativePos -= boxSize * 0.5;
      
      // 3. World Position
      vec4 mvPosition = modelViewMatrix * vec4(uCameraPos + relativePos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // 4. AESTHETIC CHOICE: 1-Pixel Particles
      // Big blurry particles look cheap. 
      // Tiny, sharp, 1-pixel sparks look like "dust in a sunbeam".
      // We clamp point size to keep it crisp.
      float distScale = -mvPosition.z;
      gl_PointSize = 1.0 + (30.0 / distScale);
      gl_PointSize = clamp(gl_PointSize, 1.0, 2.5); 
      
      // 5. Soft Fading
      // Fade out particles near the edge of the box so they don't "Pop" out of existence.
      float dist = length(relativePos);
      float fadeStart = uRadius * 0.7;
      float fadeEnd = uRadius;
      vAlpha = 1.0 - smoothstep(fadeStart, fadeEnd, dist);
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying float vAlpha;
    
    void main() {
      if (vAlpha < 0.01) discard;
      
      // Simple circle cut
      vec2 coord = gl_PointCoord - vec2(0.5);
      if (length(coord) > 0.5) discard;
      
      gl_FragColor = vec4(uColor, uOpacity * vAlpha);
    }
  `;

  return (
    <points ref={pointsRef} raycast={() => null}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={MAX_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={MAX_COUNT}
          array={randoms}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </points>
  );
};
