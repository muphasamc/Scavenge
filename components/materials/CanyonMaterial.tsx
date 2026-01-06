
import React, { useMemo } from 'react';
import { Color } from 'three';

interface CanyonMaterialProps {
  color: string;
}

export const CanyonMaterial: React.FC<CanyonMaterialProps> = ({ 
  color
}) => {
  const uniforms = useMemo(() => ({
    uColor: { value: new Color(color) },
  }), []);

  // Update uniforms when props change
  useMemo(() => {
    uniforms.uColor.value.set(color);
  }, [color, uniforms]);

  const onBeforeCompile = (shader: any) => {
    shader.uniforms.uColor = uniforms.uColor;

    // Inject Varyings
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
      #include <common>
      varying vec3 vWorldPosition;
      `
    );
    
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vec4 customWorldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = customWorldPos.xyz;
      `
    );

    // Inject Noise & Color Mixing in Fragment
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `
      #include <common>
      uniform vec3 uColor;
      varying vec3 vWorldPosition;

      // Noise functions
      float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
      }

      float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
                     mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      #include <map_fragment>
      
      vec2 uvPos = vWorldPosition.xz;
      float height = vWorldPosition.y;

      // 1. Sedimentary Layers (Striations)
      // Bands are based on height (Y), perturbed by noise (XZ)
      float layerNoise = noise(uvPos * 0.1);
      float layerPos = height * 0.8 + layerNoise * 1.5;
      
      // Create repeating bands using Sine
      float bands = sin(layerPos * 3.0); 
      float sharpBands = smoothstep(0.4, 0.6, bands); // Sharpen transitions

      // 2. Texture Detail (Rock Grain)
      float grain = noise(uvPos * 12.0);
      float rockTexture = mix(0.8, 1.2, grain);

      // 3. Color Palette
      vec3 baseColor = uColor;
      vec3 bandColor = uColor * 0.5; // Darker red/brown for bands
      vec3 dustColor = vec3(0.9, 0.8, 0.7); // Light dust settling on top

      // Mix bands
      vec3 finalColor = mix(baseColor, bandColor, sharpBands * 0.6);
      
      // Add dust on horizontal surfaces
      // Standard derivative-based slope detection doesn't work easily here without passing normal
      // But we can approximate "Tops" of the terraced noise by height ranges or just noise
      // For now, let's just add "dust" pockets
      float dustNoise = noise(uvPos * 0.5);
      if (dustNoise > 0.7) {
          finalColor = mix(finalColor, dustColor, 0.3);
      }
      
      finalColor *= rockTexture;

      diffuseColor.rgb = finalColor;
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `
      #include <roughnessmap_fragment>
      roughnessFactor = 0.95; // Very rough, dusty rock
      `
    );
  };

  return (
    <meshStandardMaterial
      roughness={1.0}
      metalness={0.0}
      onBeforeCompile={onBeforeCompile}
      customProgramCacheKey={() => 'canyon-material-v1'}
    />
  );
};
