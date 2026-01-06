
import { Vector3, MathUtils } from 'three';
import { TerrainType } from '../types';

// --- Math & Easing ---

/**
 * Linear interpolation between start and end by t.
 * @param start Start value
 * @param end End value
 * @param t Interpolation factor [0, 1]
 */
export const lerp = (start: number, end: number, t: number) => {
  return start * (1 - t) + end * t;
};

/**
 * Cubic Bezier Ease-In-Out function for smooth animation.
 * VIBE CHECK: Linear movement looks robotic. Physics objects have inertia.
 * This curve starts slow (overcoming inertia) and ends slow (friction).
 */
export const easeInOutCubic = (x: number): number => {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

// --- Terrain Generation ---

/**
 * DUNE GENERATOR
 * The classic domain-warped sand algorithm.
 * Uses sin-based warping to mimic wind direction.
 */
const getDuneHeight = (x: number, z: number): number => {
  let y = 0;

  // 1. DOMAIN WARPING
  const warpX = x + Math.sin(z * 0.035) * 12.0; 
  const warpZ = z + Math.sin(x * 0.040) * 8.0;

  // 2. PRIMARY SHAPE
  const baseDune = Math.sin(warpX * 0.04 + warpZ * 0.01);
  y += Math.pow(baseDune * 0.5 + 0.5, 2.5) * 5.0;

  // 3. SECONDARY DETAILS
  y += Math.sin(warpX * 0.13 + warpZ * 0.11) * 1.2;
  
  // 4. TERTIARY NOISE
  y += Math.sin(x * 0.37 - z * 0.23) * 0.35;

  // 5. GLOBAL VARIATION
  const dist = Math.sqrt(x*x + z*z);
  y += Math.sin(dist * 0.05) * 2.0;

  return y;
};

/**
 * ICE GENERATOR
 * Algorithm: "Glacial Flow"
 * Large scale smooth swells mixed with sharp, high-frequency pressure ridges.
 */
const getIceHeight = (x: number, z: number): number => {
    let y = 0;
    
    // 1. DOMAIN WARPING (The "Flow")
    const warpX = x + Math.sin(z * 0.025) * 25.0; 
    const warpZ = z + Math.sin(x * 0.025) * 20.0;

    // 2. BASE GLACIAL SWELLS (Grace)
    y += Math.sin(warpX * 0.03 + warpZ * 0.02) * 5.0;

    // 3. PRESSURE RIDGES (Spice)
    const rX = x * 0.12 + z * 0.08;
    const rZ = z * 0.12 - x * 0.08;
    
    // Sharp peaks using high-power sin
    const ridge1 = Math.pow(Math.abs(Math.sin(rX)), 4.0);
    const ridge2 = Math.pow(Math.abs(Math.sin(rZ)), 4.0);
    
    y += (ridge1 + ridge2) * 2.5;

    // 4. SURFACE VARIATION (Texture)
    y += Math.sin(x * 0.4) * Math.cos(z * 0.4) * 0.4;

    return y;
}

/**
 * CANYON GENERATOR
 * Algorithm: "Terraced Mesa"
 * High verticality using cubed sine waves to create steep cliffs and flat plateaus.
 */
const getCanyonHeight = (x: number, z: number): number => {
    let y = 0;
    
    // 1. Warping to create winding canyon paths
    // Scale is smaller for "tighter" canyons
    const warpX = x + Math.sin(z * 0.012) * 30.0;
    const warpZ = z + Math.cos(x * 0.015) * 30.0;
    
    // 2. Primary Elevation (Mesas)
    // Cubing the sine wave pushes values towards -1 and 1, creating wide flats and steep slopes
    const scale = 0.012;
    const base = Math.sin(warpX * scale) * Math.cos(warpZ * scale);
    
    // Vertical multiplier is High (22.0)
    y = Math.pow(base, 3.0) * 22.0; 
    
    // 3. Terracing / Erosion
    // Add steps to the vertical faces to give the IK something to hold onto
    // and to simulate sedimentary layers.
    y += Math.sin(y * 1.5) * 1.2;
    
    // 4. Roughness
    // Rocky texture on top
    y += Math.sin(x * 0.3) * Math.cos(z * 0.24) * 0.8;
    
    return y;
}

/**
 * CRYSTAL GENERATOR (Bismuth)
 * Algorithm: "Construct"
 * Quantized, stepped blocks to create a crystal/city look.
 * Mimics "Hopper Crystals" often seen in Bismuth.
 */
const getCrystalHeight = (x: number, z: number): number => {
    // 1. Block Quantization
    const blockSize = 15.0; // Must be large enough to align somewhat with mesh resolution
    const qx = Math.floor(x / blockSize);
    const qz = Math.floor(z / blockSize);
    
    // 2. Deterministic Hash (Simulate random height per block)
    // Simple sin-hash to get a pseudo-random value [0, 1] for this block
    const hash = Math.sin(qx * 12.9898 + qz * 78.233) * 43758.5453;
    const val = hash - Math.floor(hash); 
    
    // 3. Stepped Heights (The City Skyline)
    let h = 0;
    
    if (val > 0.85) {
        h = 8.0; // Tall Pillar
    } else if (val > 0.6) {
        h = 4.0; // Mid Platform
    } else if (val > 0.4) {
        h = -2.0; // Trench
    }
    
    // 4. Global Warping (Subtle swell to prevent it looking completely flat)
    h += Math.sin(x * 0.02 + z * 0.02) * 2.0;

    return h;
}

/**
 * Main Terrain Height Function
 * Now supports multiple biomes.
 */
export const getTerrainHeight = (x: number, z: number, type: TerrainType = 'sand'): number => {
  if (type === 'ice') return getIceHeight(x, z);
  if (type === 'canyon') return getCanyonHeight(x, z);
  if (type === 'crystal') return getCrystalHeight(x, z);
  return getDuneHeight(x, z);
};

// --- Inverse Kinematics ---

// OPTIMIZATION: Pre-allocate vectors to avoid GC churn in the IK loop.
const _ik_dir = new Vector3();
const _ik_forward = new Vector3();
const _ik_right = new Vector3();
const _ik_up = new Vector3();
const _ik_jointDir = new Vector3();
const _ik_result = new Vector3();

/**
 * Solves a 2-Bone Inverse Kinematics problem.
 * returns the world position of the joint (elbow).
 */
export const solveIK = (
  origin: Vector3,
  target: Vector3,
  l1: number,
  l2: number,
  hintUp: Vector3, 
  hintForward: Vector3
): Vector3 | null => {
  // 1. Get the reach vector
  _ik_dir.subVectors(target, origin);
  const dist = _ik_dir.length();

  // 2. Clamp for sanity
  const maxReach = l1 + l2 - 0.01;
  const minReach = Math.abs(l1 - l2) + 0.01;
  const safeDist = MathUtils.clamp(dist, minReach, maxReach);

  // 3. LAW OF COSINES (The Magic)
  // Calculate the angle at the shoulder
  const cosAngle1 = (l1 * l1 + safeDist * safeDist - l2 * l2) / (2 * l1 * safeDist);
  const angle1 = Math.acos(MathUtils.clamp(cosAngle1, -1, 1));

  // 4. Construct the Leg Plane (The "Orientation")
  // We need a plane to bend the leg in. 
  _ik_forward.copy(_ik_dir).normalize(); 
  
  // Calculate Right vector based on Up hint
  _ik_right.crossVectors(_ik_forward, hintUp).normalize();
  
  // Fallback if forward/up are parallel
  if (_ik_right.lengthSq() < 0.01) {
     _ik_right.crossVectors(_ik_forward, hintForward).normalize();
  }

  // Recalculate true up for this plane
  _ik_up.crossVectors(_ik_right, _ik_forward).normalize();

  // 5. Calculate Elbow Position
  // Rotate forward vector by angle1 within the plane
  _ik_jointDir.copy(_ik_forward).multiplyScalar(Math.cos(angle1))
              .add(_ik_up.multiplyScalar(Math.sin(angle1)));

  return _ik_result.copy(origin).add(_ik_jointDir.multiplyScalar(l1));
};
