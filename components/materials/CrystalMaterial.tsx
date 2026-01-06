
import React, { useMemo } from 'react';
import { Color } from 'three';

interface CrystalMaterialProps {
  color: string;
}

export const CrystalMaterial: React.FC<CrystalMaterialProps> = ({ 
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
    // We only need World Position. 
    // We calculate Fresnel using Camera Position (uniform) and World Position.
    // This avoids 'vViewPosition' conflicts and dependency on vertex shader view pos.
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
      // Calculate world position
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
      varying vec3 vWorldPosition;
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      #include <map_fragment>
      
      // Calculate View Direction (Camera to Surface)
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      
      // Calculate Face Normal in World Space using derivatives
      // This gives us the flat-shaded normal without relying on 'vNormal' which is absent in FLAT_SHADED mode
      // Renamed variables to avoid collision with Three.js internal 'fdx'/'fdy'
      vec3 worldFdx = dFdx(vWorldPosition);
      vec3 worldFdy = dFdy(vWorldPosition);
      vec3 faceNormal = normalize(cross(worldFdx, worldFdy));
      
      // Calculate Fresnel
      // dot(viewDir, normal) is negative if looking at face, so we take abs
      float fresnel = pow(1.0 - abs(dot(viewDir, faceNormal)), 3.0);
      
      // Iridescence Palette (Bismuth)
      // Pink -> Gold -> Cyan -> Deep Purple
      vec3 c1 = vec3(1.0, 0.0, 0.5); // Magenta
      vec3 c2 = vec3(1.0, 0.8, 0.0); // Gold
      vec3 c3 = vec3(0.0, 1.0, 1.0); // Cyan
      
      // Mix based on fresnel
      vec3 iridescent = mix(uColor, c1, fresnel * 0.5);
      iridescent = mix(iridescent, c2, smoothstep(0.4, 0.6, fresnel));
      iridescent = mix(iridescent, c3, smoothstep(0.7, 1.0, fresnel));
      
      // Add a metallic banding pattern
      float banding = sin(vWorldPosition.y * 2.0 + vWorldPosition.x * 0.5) * 0.5 + 0.5;
      iridescent += banding * 0.2;

      diffuseColor.rgb = iridescent;
      `
    );
    
    // Set roughness
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `
      #include <roughnessmap_fragment>
      roughnessFactor = 0.1; 
      `
    );
  };

  return (
    <meshStandardMaterial
      flatShading={true} 
      roughness={0.1}
      metalness={0.9}
      onBeforeCompile={onBeforeCompile}
      customProgramCacheKey={() => 'crystal-material-v3'}
    />
  );
};
