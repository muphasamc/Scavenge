
import React, { useMemo, useRef, useEffect } from 'react';
import { BackSide, Color, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

interface BackgroundProps {
  colorSpace: string;
  colorHorizon: string;
  colorSun: string;
  sunDirection: Vector3; // Normalized direction vector
  distortionStrength: number;
}

const Background: React.FC<BackgroundProps> = ({ 
  colorSpace, 
  colorHorizon, 
  colorSun, 
  sunDirection, 
  distortionStrength 
}) => {
  const materialRef = useRef<any>(null);
  
  const uniforms = useMemo(() => ({
    uColorSpace: { value: new Color(colorSpace) },
    uColorHorizon: { value: new Color(colorHorizon) },
    uColorSun: { value: new Color(colorSun) },
    uSunPosition: { value: new Vector3().copy(sunDirection) },
    uDistortionStrength: { value: distortionStrength },
    uTime: { value: 0 },
  }), []);

  // Update uniforms when props change
  useEffect(() => {
    if (materialRef.current) {
        materialRef.current.uniforms.uColorSpace.value.set(colorSpace);
        materialRef.current.uniforms.uColorHorizon.value.set(colorHorizon);
        materialRef.current.uniforms.uColorSun.value.set(colorSun);
        materialRef.current.uniforms.uSunPosition.value.copy(sunDirection);
        materialRef.current.uniforms.uDistortionStrength.value = distortionStrength;
    }
  }, [colorSpace, colorHorizon, colorSun, sunDirection, distortionStrength]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const vertexShader = `
    varying vec3 vWorldPosition;
    
    void main() {
      vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `;

  const fragmentShader = `
    uniform vec3 uColorSpace;
    uniform vec3 uColorHorizon;
    uniform vec3 uColorSun;
    uniform vec3 uSunPosition;
    uniform float uDistortionStrength;
    uniform float uTime;
    
    varying vec3 vWorldPosition;

    // Simple noise
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      vec3 viewDir = normalize(vWorldPosition);
      
      // 1. Sky Gradient (Vertical)
      float horizonFactor = smoothstep(-0.2, 0.6, viewDir.y);
      vec3 skyColor = mix(uColorHorizon, uColorSpace, horizonFactor);
      
      // 2. Heat Distortion Setup
      // We distort the view direction used for the sun calculation based on height and time
      float distortion = sin(viewDir.y * 100.0 + uTime * 2.0) * uDistortionStrength;
      // Only distort near the horizon
      distortion *= (1.0 - smoothstep(0.0, 0.3, viewDir.y));
      
      vec3 distortedDir = viewDir;
      distortedDir.x += distortion;

      // 3. Sun Shape
      float sunDot = dot(distortedDir, uSunPosition);
      // Large sun disk
      float sunRadius = 0.985; 
      float sunEdge = smoothstep(sunRadius, sunRadius + 0.005, sunDot);
      
      // Sun Glow (Atmospheric scattering)
      float sunGlow = pow(max(0.0, dot(viewDir, uSunPosition)), 8.0) * 0.6;
      float wideGlow = pow(max(0.0, dot(viewDir, uSunPosition)), 2.0) * 0.1;
      
      // 4. Combine
      vec3 finalColor = skyColor;
      
      // Add Sun (Core + Color)
      finalColor += uColorSun * sunEdge * 3.0; // The sun disk itself (very bright)
      finalColor += uColorSun * sunGlow;       // The ambient glow
      finalColor += uColorHorizon * wideGlow;   // Wide horizon glow
      
      // 5. Stars (Subtle, fading out near sun and horizon)
      // Simple procedural stars
      float starThreshold = 0.998;
      float starVal = random(gl_FragCoord.xy / 800.0); // Resolution independent-ish
      if (starVal > starThreshold) {
          // Fade stars near horizon and sun
          float visibility = smoothstep(0.2, 0.5, viewDir.y) * (1.0 - sunGlow * 10.0);
          finalColor += vec3(visibility);
      }
      
      // Horizon Band boost
      float horizonBand = 1.0 - smoothstep(0.0, 0.1, abs(viewDir.y));
      finalColor += uColorHorizon * horizonBand * 0.2;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  return (
    <mesh>
      <sphereGeometry args={[900, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        side={BackSide}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        depthWrite={false}
      />
    </mesh>
  );
};

export default Background;
