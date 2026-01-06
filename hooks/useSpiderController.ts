
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion, Matrix4, Group, MathUtils, Mesh } from 'three';
import { getTerrainHeight, easeInOutCubic } from '../utils/helpers';
import { SPIDER_CONFIG } from '../config';
import { LegState, LegConfiguration, PhysicsConfig, TerrainType } from '../types';

// Optimization: Pre-allocate vector objects to avoid Garbage Collection spikes during the 60fps loop.
const _vec3_a = new Vector3();
const _vec3_b = new Vector3();
const _vec3_c = new Vector3();
const _vec3_normal = new Vector3();
const _quat_a = new Quaternion();
const _mat4_a = new Matrix4();

// New pooled vectors for loop calculations
const _vec3_home = new Vector3();
const _vec3_shoulder = new Vector3();
const _vec3_lead = new Vector3();
const _vec3_forward = new Vector3();

// --- POOLING FOR GAIT SCHEDULER ---
// Avoid creating {index, dist} objects every frame.
// We use a persistent array of objects that we mutate in place.
interface StepCandidate {
    index: number;
    dist: number;
    isCritical: boolean;
}
const MAX_LEGS = 8;
const _pooledCandidates: StepCandidate[] = new Array(MAX_LEGS).fill(null).map((_, i) => ({
    index: i,
    dist: 0,
    isCritical: false
}));

/**
 * USE SPIDER CONTROLLER
 * The "Brain" of the creature. 
 * Handles Physics (Inertia), Gait Scheduling (Leg Lifting), and IK Targets.
 */
export const useSpiderController = (
  target: Vector3, 
  mousePosRef: React.MutableRefObject<Vector3>,
  onMoveStateChange: (isMoving: boolean) => void,
  physicsConfig: PhysicsConfig,
  terrainType: TerrainType
) => {
  const groupRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const bodyMeshRef = useRef<Mesh>(null);
  
  const wasMovingRef = useRef(false);

  // -- Physics State --
  // We use a Ref instead of State because this updates 60 times a second.
  // Triggering React Renders for this would kill performance.
  const sim = useRef({
    position: new Vector3(0, 10, 0),
    velocity: new Vector3(),
    quaternion: new Quaternion(),
    legs: [] as LegState[],
    legConfigs: [] as LegConfiguration[],
    time: 0,
    gazeTarget: new Vector3(),
    nextGazeTime: 0,
  });

  // -- Initialization --
  useMemo(() => {
    if (sim.current.legConfigs.length > 0) return;

    // Define 8 Legs (Insectoid Stagger)
    // We create a "Rest" position for each leg relative to the body.
    const legCount = 8;
    for (let i = 0; i < legCount; i++) {
      const side = i < 4 ? 1 : -1; // Right vs Left
      const row = i % 4; // 0 (front) to 3 (back)
      
      const isFront = row === 0;
      
      // Feature: Make front legs shorter ("Feelers") but ensure they have enough IK slack
      const legScale = isFront ? 0.92 : 1.0;
      const currentL1 = SPIDER_CONFIG.LEG_L1 * legScale;
      const currentL2 = SPIDER_CONFIG.LEG_L2 * legScale;

      // Stagger the mounting points so they don't look like a plastic toy
      const zOffset = [1.8, 0.6, -0.6, -1.8][row];
      const xOffset = [0.8, 1.2, 1.2, 0.8][row] * side;

      const origin = new Vector3(xOffset, 0, zOffset);
      
      // "Rest" is where the leg naturally wants to sit if the spider is floating in void
      const restScale = isFront ? 0.8 : 1.0;
      
      let rX = xOffset * 2.8 * restScale;
      let rZ = zOffset * 1.5 * restScale;

      // ADJUSTMENT: Front legs (Feelers) stance initial
      if (isFront) {
          rZ += physicsConfig.frontLegReach; 
          rX *= physicsConfig.frontLegSpread;
      }

      const rest = new Vector3(
          rX, 
          -physicsConfig.bodyHeight, 
          rZ
      );

      const startX = rest.x;
      const startZ = rest.z;
      const startY = getTerrainHeight(startX, startZ, terrainType);

      sim.current.legConfigs.push({
        id: i,
        originOffset: origin,
        restOffset: rest,
        maxReach: currentL1 + currentL2,
        l1: currentL1,
        l2: currentL2
      });

      sim.current.legs.push({
        currentPos: new Vector3(startX, startY, startZ),
        targetPos: new Vector3(startX, startY, startZ),
        stepStartPos: new Vector3(startX, startY, startZ),
        homePos: new Vector3(),
        isStepping: false,
        stepProgress: 0,
        stepHeight: 0,
      });
    }
  }, []); // Only run once on mount

  // -- Real-time Config Updates --
  // If the user drags sliders, we update the internal physics configurations immediately
  useEffect(() => {
     // Re-calculate Rest Offsets for Front Legs based on sliders
     sim.current.legConfigs.forEach((config, i) => {
         const row = i % 4;
         const isFront = row === 0;

         // We recover the base logic from initialization to apply new modifiers
         const side = i < 4 ? 1 : -1;
         const xOffset = [0.8, 1.2, 1.2, 0.8][row] * side;
         const zOffset = [1.8, 0.6, -0.6, -1.8][row];
         const restScale = isFront ? 0.8 : 1.0;
         
         let rX = xOffset * 2.8 * restScale;
         let rZ = zOffset * 1.5 * restScale;

         if (isFront) {
             rZ += physicsConfig.frontLegReach; // Dynamic Reach
             rX *= physicsConfig.frontLegSpread; // Dynamic Spread
         }

         config.restOffset.set(rX, -physicsConfig.bodyHeight, rZ);
     });
  }, [physicsConfig.frontLegReach, physicsConfig.frontLegSpread, physicsConfig.bodyHeight]);


  // -- THE LOOP --
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const s = sim.current;
    s.time += delta;

    // ----------------------------
    // 1. KINEMATICS (Moving the Body)
    // ----------------------------
    const currentPos = s.position;

    // Ignore Y axis for navigation (we walk on a 2D map, height is procedural)
    const flatTarget = _vec3_a.set(target.x, 0, target.z);
    const flatPos = _vec3_b.set(currentPos.x, 0, currentPos.z);
    const dirToTarget = _vec3_c.subVectors(flatTarget, flatPos);
    const distToTarget = dirToTarget.length();

    let speed = 0;
    const isMoving = distToTarget > 0.1;

    if (isMoving !== wasMovingRef.current) {
        wasMovingRef.current = isMoving;
        onMoveStateChange(isMoving);
    }

    // Smooth Arrival Logic
    if (isMoving) {
      dirToTarget.normalize();
      // Slow down as we get closer (Ease-Out)
      speed = Math.min(physicsConfig.speed, distToTarget * 1.5);
      const targetVel = dirToTarget.multiplyScalar(speed);
      s.velocity.lerp(targetVel, delta * 3); // Inertia
    } else {
      s.velocity.lerp(new Vector3(0, 0, 0), delta * 5); // Friction
    }

    s.position.add(s.velocity.clone().multiplyScalar(delta));

    // ----------------------------
    // 2. ORIENTATION (Hugging the Terrain)
    // ----------------------------
    
    // Calculate Body Height
    // Average the Y position of all grounded feet.
    let avgFootPos = _vec3_a.set(0, 0, 0);
    let groundedCount = 0;

    s.legs.forEach((l) => {
      // If stepping, use TARGET position (where it will land) to predict height
      const p = l.isStepping ? l.targetPos : l.currentPos;
      avgFootPos.add(p);
      groundedCount++;
    });
    avgFootPos.divideScalar(groundedCount || 1);

    // Idle Breathing
    const breath = Math.sin(s.time * SPIDER_CONFIG.BREATHING_RATE) * SPIDER_CONFIG.BREATHING_AMP;
    const targetY = avgFootPos.y + physicsConfig.bodyHeight + breath;
    s.position.y = MathUtils.lerp(s.position.y, targetY, delta * 3);

    // Calculate Ground Normal (Slope) based on 4 corners of the spider
    const frontLeft = s.legs[0].currentPos;
    const backRight = s.legs[7].currentPos;
    const frontRight = s.legs[4].currentPos;
    const backLeft = s.legs[3].currentPos;

    _vec3_b.subVectors(frontRight, backLeft).normalize();
    _vec3_c.subVectors(frontLeft, backRight).normalize();
    _vec3_normal.crossVectors(_vec3_b, _vec3_c).normalize();
    
    if (_vec3_normal.y < 0) _vec3_normal.negate();

    // Rotate Body Up vector to match Ground Normal
    const currentQuat = s.quaternion;
    const dummyUp = _vec3_a.set(0, 1, 0).applyQuaternion(currentQuat);
    const alignQuat = _quat_a.setFromUnitVectors(dummyUp, _vec3_normal);
    s.quaternion.premultiply(alignQuat);

    // Rotate Body Forward vector to match Velocity
    if (s.velocity.lengthSq() > 0.1) {
      const velDir = s.velocity.clone().normalize();
      // Project velocity onto the ground plane so we don't look "down" into the earth
      const dot = velDir.dot(_vec3_normal);
      const forward = velDir.sub(_vec3_normal.clone().multiplyScalar(dot)).normalize();
      const right = new Vector3().crossVectors(_vec3_normal, forward).normalize();
      const lookMat = _mat4_a.makeBasis(right, _vec3_normal, forward);
      
      const targetRot = new Quaternion().setFromRotationMatrix(lookMat);
      s.quaternion.slerp(targetRot, delta * physicsConfig.turnSpeed);
    }

    // Commit transforms to ThreeJS
    groupRef.current.position.copy(s.position);
    groupRef.current.quaternion.copy(s.quaternion);
    groupRef.current.updateMatrixWorld();

    // ----------------------------
    // 3. GAIT SCHEDULER (The Walking Logic)
    // ----------------------------
    const bodyMatrix = groupRef.current.matrixWorld;
    const activeSteppers = s.legs.filter((l) => l.isStepping).length;

    // SCORING PHASE: Calculate how "uncomfortable" each leg is.
    // OPTIMIZATION: We loop through legConfigs and update the _pooledCandidates array in place.
    // This avoids creating new objects during the render loop.
    for(let i=0; i<8; i++) {
        const leg = s.legs[i];
        
        // "Home" is where the leg wants to be relative to the body
        _vec3_home.copy(s.legConfigs[i].restOffset).applyMatrix4(bodyMatrix);

        // PREDICTION: If moving, aim for where "Home" will be in the future (0.1s)
        if (speed > 0.1) {
            _vec3_lead.copy(s.velocity).multiplyScalar(0.1);
            _vec3_home.add(_vec3_lead);
        }

        // Raycast (Math version) to find terrain height at home
        _vec3_home.y = getTerrainHeight(_vec3_home.x, _vec3_home.z, terrainType);
        leg.homePos.copy(_vec3_home);

        // Distress Score
        const dist = leg.currentPos.distanceTo(_vec3_home);
        
        // Physical Limit Check (IK range)
        _vec3_shoulder.copy(s.legConfigs[i].originOffset).applyMatrix4(bodyMatrix);
        const distFromShoulder = leg.currentPos.distanceTo(_vec3_shoulder);
        const isCritical = distFromShoulder > s.legConfigs[i].maxReach * 0.9;

        // Update Pool
        _pooledCandidates[i].index = i;
        _pooledCandidates[i].dist = dist;
        _pooledCandidates[i].isCritical = isCritical;
    }

    // SORTING: We sort a *copy* or just sort the pool? 
    // Sorting the pool changes indices order, but we track index inside the object.
    // .sort() allocates a bit of stack usually, but it's better than map().
    // We create a lightweight array of references to sort to avoid messing up the pool order if needed,
    // but here we can just sort the pool directly as we reset it every frame by index loop above.
    _pooledCandidates.sort((a, b) => {
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      return b.dist - a.dist;
    });

    // EXECUTION PHASE: Trigger steps based on "Tripod" rules
    // Iterate through the sorted pool
    for(let i=0; i<8; i++) {
      const candidate = _pooledCandidates[i];
      const leg = s.legs[candidate.index];
      
      // If already stepping, skip
      if (leg.isStepping) continue;

      const isFront = (candidate.index % 4) === 0;

      // PERMISSIVENESS: Dynamic Configuration based on leg type
      const baseThreshold = physicsConfig.gaitThreshold;
      const urgencyThreshold = isFront ? baseThreshold * physicsConfig.frontLegGaitThresholdMult : baseThreshold;

      const mustStep = candidate.isCritical || candidate.dist > urgencyThreshold;

      if (mustStep) {
        // STABILITY CHECK (Tripod Gait)
        // Ensure neighbors are grounded before lifting.
        const neighbors = [
          (candidate.index + 1) % 8, 
          (candidate.index + 7) % 8, 
          (candidate.index + 4) % 8, 
        ];

        const neighborsStepping = neighbors.some((nIdx) => s.legs[nIdx].isStepping);

        // Allow step if stable OR if physically impossible to hold (critical)
        if ((!neighborsStepping && activeSteppers < physicsConfig.maxActiveSteps) || candidate.isCritical) {
          // START STEP
          leg.isStepping = true;
          leg.stepProgress = 0;
          leg.stepStartPos.copy(leg.currentPos);

          // VELOCITY PREDICTION (Where will the body be when step lands?)
          const leadVec = _vec3_lead.copy(s.velocity).multiplyScalar(physicsConfig.stepDuration * physicsConfig.gaitRecovery);
          if (leadVec.length() > SPIDER_CONFIG.MAX_STRIDE) leadVec.setLength(SPIDER_CONFIG.MAX_STRIDE);

          leg.targetPos.copy(leg.homePos).add(leadVec);
          leg.targetPos.y = getTerrainHeight(leg.targetPos.x, leg.targetPos.z, terrainType);
          
          leg.stepHeight = physicsConfig.stepHeight * (0.9 + Math.random() * 0.2);
        }
      }
    }

    // ANIMATION PHASE
    s.legs.forEach((leg, i) => {
      if (leg.isStepping) {
        // SMOOTHNESS: Dynamic Front Leg Speed
        const isFront = (i % 4) === 0;
        const duration = isFront ? physicsConfig.stepDuration * physicsConfig.frontLegStepDurationMult : physicsConfig.stepDuration;

        leg.stepProgress += delta / duration;

        if (leg.stepProgress >= 1.0) {
          // Landed
          leg.isStepping = false;
          leg.currentPos.copy(leg.targetPos);
        } else {
          // In Flight
          const t = leg.stepProgress;
          const easedT = easeInOutCubic(t);
          
          leg.currentPos.lerpVectors(leg.stepStartPos, leg.targetPos, easedT);

          const verticalOffset = Math.sin(t * Math.PI) * leg.stepHeight;
          const baseY = MathUtils.lerp(leg.stepStartPos.y, leg.targetPos.y, easedT);
          leg.currentPos.y = baseY + verticalOffset;
        }
      }
    });

    // ----------------------------
    // 4. HEAD TRACKING
    // ----------------------------
    if (headRef.current) {
      // Calculate Body Forward Vector in World Space
      // Assumes Z+ is forward based on leg configuration layout
      const bodyForward = _vec3_forward.set(0, 0, 1).applyQuaternion(s.quaternion).normalize();

      if (isMoving) {
        // LOGIC FIX: "Don't Look Down"
        // If we are very close to the target, looking directly at the ground coordinate
        // causes the head to dip unnaturally.
        // Instead, we blend the gaze from "Target" to "Straight Ahead" as we arrive.
        const proximityThreshold = 8.0;
        
        if (distToTarget < proximityThreshold) {
            // Create a virtual target far ahead of the spider
            const lookAheadPoint = _vec3_lead.copy(s.position).add(bodyForward.multiplyScalar(20));
            
            // 0.0 = At Target, 1.0 = At Body location
            // We want: Far -> Target. Close -> LookAhead.
            const blendFactor = 1.0 - (distToTarget / proximityThreshold);
            const safeBlend = MathUtils.clamp(blendFactor, 0, 1);
            
            // Smoothly blend the gaze target
            s.gazeTarget.lerpVectors(target, lookAheadPoint, easeInOutCubic(safeBlend));
        } else {
            s.gazeTarget.copy(target);
        }
      } else {
        // Idle Behavior: Look around randomly
        if (s.time > s.nextGazeTime) {
            const noise = _vec3_a.set(
                (Math.random() - 0.5) * 6, 
                0, 
                (Math.random() - 0.5) * 6
            );
            s.gazeTarget.copy(mousePosRef.current).add(noise);
            s.nextGazeTime = s.time + 0.5 + Math.random() * 2.0;
        }
      }

      const lookTarget = _vec3_b.copy(s.gazeTarget);
      lookTarget.y = getTerrainHeight(lookTarget.x, lookTarget.z, terrainType) + 1.0;

      // Smoothly slerp head rotation
      const currentQuat = headRef.current.quaternion.clone();
      headRef.current.lookAt(lookTarget);
      const targetQuat = headRef.current.quaternion.clone();
      headRef.current.quaternion.copy(currentQuat);

      const slerpSpeed = isMoving ? 5 : 2;
      headRef.current.quaternion.slerp(targetQuat, delta * slerpSpeed);
    }
  });

  return { groupRef, headRef, bodyMeshRef, legs: sim.current.legs, legConfigs: sim.current.legConfigs };
};
