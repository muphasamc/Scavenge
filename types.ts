
import { Vector3 } from "three";
import React from 'react';

export type TerrainType = 'grid' | 'sand' | 'ice' | 'canyon' | 'crystal';

export interface LegConfiguration {
  id: number;
  originOffset: Vector3; // Shoulder attachment point relative to body center
  restOffset: Vector3;   // Ideal foot position relative to body center (at rest)
  maxReach: number;
  l1: number;            // Upper leg length
  l2: number;            // Lower leg length
}

export interface LegState {
  currentPos: Vector3;      // Current world position of foot
  targetPos: Vector3;       // Target world position (if stepping) or current (if grounded)
  isStepping: boolean;
  stepProgress: number;     // 0.0 to 1.0
  stepStartPos: Vector3;    // World position where step began
  stepHeight: number;       // Calculated height for this specific step
  homePos: Vector3;         // The calculated "ideal" world position for this frame
}

export interface IKResult {
  shoulder: Vector3;
  elbow: Vector3;
  foot: Vector3;
  isValid: boolean;
}

export interface SpiderSimState {
    position: Vector3;
    velocity: Vector3;
    legs: LegState[];
    legConfigs: LegConfiguration[];
}

export interface VisualConfig {
  showBody: boolean;
  showPlating: boolean;
  platingOpacity: number;
  
  // Face Light / Sensors
  faceLightColor: string;
  faceLightIntensity: number;
  faceLightDistance: number;
  faceLightAngle: number;
  faceLightPenumbra: number;
}

export interface PhysicsConfig {
  // Movement
  speed: number;
  turnSpeed: number;
  bodyHeight: number;
  
  // Gait / Stepping
  stepHeight: number;
  stepDuration: number;
  gaitThreshold: number;
  gaitRecovery: number; // Velocity prediction
  maxActiveSteps: number;
  
  // Front Leg "Feelers" Tuning
  frontLegReach: number; // Z-offset (How far forward)
  frontLegSpread: number; // X-multiplier (How narrow)
  frontLegStepDurationMult: number; // Slower/Faster steps
  frontLegGaitThresholdMult: number; // More/Less permissive
  
  // Body Shape
  abdomenScale: number;
}

export interface BgConfig {
    colorSpace: string;
    colorHorizon: string;
    colorSun: string;
    sunElevation: number;
    sunAzimuth: number;
    autoRotate: boolean;
    distortionStrength: number;
    
    // Particulate System
    dustOpacity: number; // 0 to 1 (Alpha transparency)
    dustSpeed: number;   // Vertical/Horizontal flow speed
    dustCount: number;   // Number of active particles (Density)
    dustRadius: number;  // Range from camera (Volume size)
    dustColor: string;
    
    // Cloud System
    cloudColor: string;
    cloudOpacity: number;
    cloudCount: number;
    cloudAltitude: number;
    cloudSpeed: number;

    terrainColor: string;
    terrainType: TerrainType;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      group: any;
      primitive: any;
      points: any;
      fog: any;
      
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      shaderMaterial: any;
      
      bufferGeometry: any;
      boxGeometry: any;
      cylinderGeometry: any;
      sphereGeometry: any;
      coneGeometry: any;
      ringGeometry: any;
      
      directionalLight: any;
      pointLight: any;
      spotLight: any;
      hemisphereLight: any;
      ambientLight: any;
      
      bufferAttribute: any;

      // Allow all other elements (including HTML divs, spans, buttons, etc.)
      [elemName: string]: any;
    }
  }
}