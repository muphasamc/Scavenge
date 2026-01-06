
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Vector3, MOUSE } from 'three';

// Components
import Spider from './components/Spider';
import Terrain from './components/Terrain';
import Background from './components/Background';
import { DustParticles } from './components/DustParticles';
import { Clouds } from './components/Clouds';
import Overlay from './components/Overlay';

// Types & Utils
import { BgConfig, VisualConfig, PhysicsConfig } from './types';
import { getTerrainHeight } from './utils/helpers';
import { BIOMES } from './data/biomes';
import { SPIDER_CONFIG } from './config';

const App: React.FC = () => {
  const [target, setTarget] = useState<Vector3>(new Vector3(0, 0, 10));
  
  // Environment Configuration State
  const [bgConfig, setBgConfig] = useState<BgConfig>(
    BIOMES.find(b => b.id === 'volcanic')?.config || BIOMES[0].config
  );
  
  // Initialize marker based on initial height (need to check terrainType)
  const [marker, setMarker] = useState<Vector3>(
    new Vector3(0, getTerrainHeight(0, 10, bgConfig.terrainType), 10)
  );
  
  const [isLocked, setIsLocked] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  
  // Visual Configuration State
  const [visualConfig, setVisualConfig] = useState<VisualConfig>({
    showBody: true,
    showPlating: false,
    platingOpacity: 1,
    // Face Light Defaults
    faceLightColor: "#ff0044",
    faceLightIntensity: 20,
    faceLightDistance: 34,
    faceLightAngle: 0.95,
    faceLightPenumbra: 0.8,
  });

  // Physics Configuration State (Lifted from config.ts + New params)
  const [physicsConfig, setPhysicsConfig] = useState<PhysicsConfig>({
    speed: 4.5,
    turnSpeed: 2.9,
    bodyHeight: 1.5,
    stepHeight: 1.0,
    stepDuration: 0.29,
    gaitThreshold: 1.5,
    gaitRecovery: 1.4,
    maxActiveSteps: 3,
    
    // Default tuned values for the feelers
    frontLegReach: 0.6, 
    frontLegSpread: 0.8,
    frontLegStepDurationMult: 0.9,
    frontLegGaitThresholdMult: 0.9,
    
    // Default Body Shape
    abdomenScale: 1.2,
  });

  // Ref to track mouse position for head look-at without triggering re-renders
  const mousePosRef = useRef<Vector3>(new Vector3(0, 0, 10));

  const controlsRef = useRef<any>(null);

  // Auto-Rotation Logic
  useEffect(() => {
    if (!bgConfig.autoRotate) return;
    
    let animationFrameId: number;
    const animate = () => {
      setBgConfig(prev => ({
        ...prev,
        sunAzimuth: (prev.sunAzimuth + 0.0005) % (Math.PI * 2)
      }));
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [bgConfig.autoRotate]);

  // Calculate Sun Direction Vector based on Azimuth/Elevation
  const sunDirection = useMemo(() => {
    const elevRad = bgConfig.sunElevation * (Math.PI / 2);
    const phi = bgConfig.sunAzimuth;

    // Spherical conversion
    const y = Math.sin(elevRad);
    const r = Math.cos(elevRad);
    const x = r * Math.sin(phi);
    const z = r * Math.cos(phi);

    return new Vector3(x, y, z).normalize();
  }, [bgConfig.sunElevation, bgConfig.sunAzimuth]);

  // Position the light far away in the calculated direction
  const sunLightPosition = useMemo(() => {
    return sunDirection.clone().multiplyScalar(100);
  }, [sunDirection]);

  return (
    <div className="relative w-full h-screen bg-[#020205] overflow-hidden">
      
      {/* 2D UI Overlay - Pass configuration down */}
      <Overlay 
        target={target}
        marker={marker}
        config={bgConfig}
        onConfigChange={setBgConfig}
        isLocked={isLocked}
        onLockToggle={() => setIsLocked(!isLocked)}
        visualConfig={visualConfig}
        onVisualConfigChange={setVisualConfig}
        physicsConfig={physicsConfig}
        onPhysicsConfigChange={setPhysicsConfig}
      />

      <Canvas
        shadows
        dpr={[1, 1.5]} // Clamp pixel ratio for high-dpi screens to save GPU
        gl={{ antialias: true, toneMappingExposure: 1.1 }}
      >
        <PerspectiveCamera makeDefault position={[25, 20, 25]} fov={40} />
        
        {/* Fog blended with the dynamic horizon color - adjusted for larger map */}
        <fog attach="fog" args={[bgConfig.colorHorizon, 50, 450]} />
        
        {/* Background Atmosphere Shader */}
        <Background 
          colorSpace={bgConfig.colorSpace}
          colorHorizon={bgConfig.colorHorizon}
          colorSun={bgConfig.colorSun}
          sunDirection={sunDirection}
          distortionStrength={bgConfig.distortionStrength}
        />

        {/* Ambient Fill - Tinted by horizon/space */}
        <hemisphereLight 
            args={[bgConfig.colorHorizon, bgConfig.colorSpace, 0.8]} 
        />
        
        {/* Main Key Light - Sun */}
        <directionalLight
          position={sunLightPosition} 
          intensity={2.5}
          color={bgConfig.colorSun}
          castShadow
          // OPTIMIZATION: Reduced from 4096 to 2048. 
          // 4096 is extremely expensive for full-scene shadows.
          shadow-mapSize={[2048, 2048]} 
          shadow-camera-left={-150}
          shadow-camera-right={150}
          shadow-camera-top={150}
          shadow-camera-bottom={-150}
          shadow-bias={-0.0001}
        />

        {/* Rim Light for shape definition - Static contrast */}
        <spotLight position={[30, 10, 30]} intensity={8} color="#00ffaa" distance={60} angle={0.8} penumbra={1} />
        
        {/* Clickable Terrain Area */}
        <group
           onClick={(e) => {
             // Only process left clicks (button 0)
             if (e.button === 0) {
               e.stopPropagation();
               const point = e.point;
               setTarget(point);
               setMarker(point);
             }
           }}
           onPointerMove={(e) => {
             e.stopPropagation();
             mousePosRef.current.copy(e.point);
           }}
        >
           <Terrain color={bgConfig.terrainColor} type={bgConfig.terrainType} />
        </group>
        
        {/* Atmospheric Dust */}
        <DustParticles 
          opacity={bgConfig.dustOpacity}
          speed={bgConfig.dustSpeed}
          count={bgConfig.dustCount}
          color={bgConfig.dustColor}
          radius={bgConfig.dustRadius}
        />

        {/* Cloud Layers */}
        <Clouds 
          color={bgConfig.cloudColor} 
          opacity={bgConfig.cloudOpacity}
          count={bgConfig.cloudCount}
          altitude={bgConfig.cloudAltitude}
          speed={bgConfig.cloudSpeed}
        />

        {/* Main Character */}
        <Spider 
          target={target} 
          mousePosRef={mousePosRef}
          onMoveStateChange={setIsMoving}
          isLocked={isLocked} 
          controlsRef={controlsRef} 
          visualConfig={visualConfig}
          physicsConfig={physicsConfig}
          terrainType={bgConfig.terrainType}
        />

        {/* Target Marker Visual - Only visible when moving */}
        {isMoving && (
          <group position={marker}>
              <mesh position={[0, 2, 0]} rotation={[Math.PI, 0, 0]}>
                  <coneGeometry args={[0.2, 4, 4]} />
                  <meshBasicMaterial color="#00ffff" transparent opacity={0.4} wireframe />
              </mesh>
              <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.05, 0]}>
                   <ringGeometry args={[0.4, 0.5, 32]} />
                   <meshBasicMaterial color="#00ffff" opacity={0.8} transparent side={2} />
              </mesh>
              <pointLight position={[0, 1, 0]} distance={8} intensity={5} color="#00ffff" />
          </group>
        )}

        <OrbitControls 
          ref={controlsRef}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={10}
          maxDistance={250}
          enablePan={!isLocked}
          autoRotate={false}
          enableDamping={true}
          dampingFactor={0.05}
          target={[0, 0, 0]}
          mouseButtons={{
            LEFT: -1 as any, // Disable left click for orbit so we can click terrain
            MIDDLE: MOUSE.DOLLY,
            RIGHT: MOUSE.ROTATE
          }}
        />
      </Canvas>
    </div>
  );
};

export default App;
