

import React, { useMemo } from 'react';
import { Color } from 'three';

interface IceMaterialProps {
  color: string;
}

export const IceMaterial: React.FC<IceMaterialProps> = ({ 
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

      // Hash for noise
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

      // 1. Texture Layers
      // Adjusted scales for "Graceful" look - larger features
      float n1 = noise(uvPos * 0.4); // Large ice sheets
      float n2 = noise(uvPos * 8.0); // Fine surface crystals
      
      // Cracks - Thinner and sharper
      float cracks = smoothstep(0.48, 0.52, abs(noise(uvPos * 1.5) - 0.5));
      
      // 2. Color Composition
      vec3 deepIce = uColor * 0.35;    // Deep translucent blue
      vec3 midIce = uColor * 0.9;      // Standard surface
      vec3 snow = vec3(0.96, 0.98, 1.0); // Powdery snow
      
      // Map height to color (Peaks = Snow, Valleys = Deep Ice)
      // We expect heights from -5 to +10 roughly
      float heightFactor = smoothstep(-2.0, 6.0, vWorldPosition.y);
      
      vec3 finalColor = mix(deepIce, midIce, heightFactor);
      
      // Add Snow on peaks and ridges
      // We use the noise n1 to break up the snow line naturally
      float snowThreshold = 4.0 + (n1 * 2.0); 
      float snowMask = smoothstep(snowThreshold - 1.0, snowThreshold + 0.5, vWorldPosition.y);
      
      finalColor = mix(finalColor, snow, snowMask);
      
      // Add Sparkles/Glints (Specular helper)
      float sparkle = smoothstep(0.85, 1.0, n2) * 0.4;
      finalColor += sparkle;

      // Darken Cracks (Subtle occlusion)
      finalColor *= mix(0.8, 1.0, cracks);

      diffuseColor.rgb = finalColor;
      `
    );

    // Update Roughness in the correct chunk
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `
      #include <roughnessmap_fragment>
      
      // Re-calculate noise masks for roughness
      float rN1 = noise(vWorldPosition.xz * 0.4);
      float rSnowThreshold = 4.0 + (rN1 * 2.0);
      float rSnowMask = smoothstep(rSnowThreshold - 1.0, rSnowThreshold + 0.5, vWorldPosition.y);
      
      // Ice is very smooth (0.05), Snow is matte (0.8)
      float targetRoughness = 0.05 + (rSnowMask * 0.85);
      
      roughnessFactor = targetRoughness;
      `
    );
  };

  return (
    <meshStandardMaterial
      roughness={0.1}
      metalness={0.3}
      onBeforeCompile={onBeforeCompile}
      customProgramCacheKey={() => 'ice-material-v3'}
    />
  );
};