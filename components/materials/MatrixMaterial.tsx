
import React, { useMemo } from 'react';
import { Color } from 'three';
import { useFrame } from '@react-three/fiber';

interface MatrixMaterialProps {
  color: string;
}

export const MatrixMaterial: React.FC<MatrixMaterialProps> = ({ 
  color
}) => {
  const uniforms = useMemo(() => ({
    uColor: { value: new Color(color) },
    uTime: { value: 0 },
  }), []);

  // Update uniforms when props change
  useMemo(() => {
    uniforms.uColor.value.set(color);
  }, [color, uniforms]);
  
  useFrame((state) => {
      uniforms.uTime.value = state.clock.elapsedTime;
  });

  const onBeforeCompile = (shader: any) => {
    shader.uniforms.uColor = uniforms.uColor;
    shader.uniforms.uTime = uniforms.uTime;

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

    // Inject Shader Logic
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `
      #include <common>
      uniform vec3 uColor;
      uniform float uTime;
      varying vec3 vWorldPosition;
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      #include <map_fragment>
      
      vec2 uvPos = vWorldPosition.xz;
      float height = vWorldPosition.y;

      // 1. The Grid
      // We create a scrolling grid pattern
      float scale = 0.5;
      vec2 gridUV = fract(uvPos * scale);
      
      // Grid line thickness
      float lineWidth = 0.05;
      float gridX = smoothstep(lineWidth, 0.0, abs(gridUV.x - 0.5));
      float gridY = smoothstep(lineWidth, 0.0, abs(gridUV.y - 0.5));
      float grid = max(gridX, gridY);
      
      // 2. Data Streams (Scrolling vertical bands)
      float stream = sin(uvPos.x * 0.2 + uTime * 2.0) * sin(uvPos.y * 0.2 + uTime * 1.5);
      float streamMask = smoothstep(0.8, 1.0, stream);
      
      // 3. Edge Highlight (Height based)
      // Highlight the tops of the pillars
      // We detect flat areas roughly by checking derivative (or just visual hacks)
      // Since it's blocky, we can just use height bands
      float rim = smoothstep(0.4, 0.5, abs(fract(height / 4.0) - 0.5));
      
      // 4. Color Compose
      vec3 baseDark = vec3(0.02, 0.02, 0.05);
      vec3 glowColor = uColor * 2.0;
      
      vec3 finalColor = baseDark;
      
      // Add Grid
      finalColor += glowColor * grid * 0.5;
      
      // Add Stream
      finalColor += glowColor * streamMask * 0.8;
      
      // Add Height Rim
      // finalColor += uColor * rim * 0.2;

      // Distance fade (Digital fog)
      // float dist = length(vWorldPosition.xz);
      // finalColor *= smoothstep(200.0, 50.0, dist);

      diffuseColor.rgb = finalColor;
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `
      #include <roughnessmap_fragment>
      roughnessFactor = 0.2; // Shiny glass-like floor
      `
    );
    
    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `
        #include <emissivemap_fragment>
        // Make the grid self-luminous
        totalEmissiveRadiance += (glowColor * grid * 0.8) + (glowColor * streamMask * 0.5);
        `
    );
  };

  return (
    <meshStandardMaterial
      roughness={0.2}
      metalness={0.8}
      onBeforeCompile={onBeforeCompile}
      customProgramCacheKey={() => 'matrix-material-v1'}
    />
  );
};
