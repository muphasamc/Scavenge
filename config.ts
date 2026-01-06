
export const SPIDER_CONFIG = {
  SPEED: 2.8,             // Movement speed (World units/sec)
  TURN_SPEED: 1.8,        // Rotation speed
  BODY_HEIGHT: 1.8,       // Target height above terrain
  STEP_HEIGHT: 1.4,       // Height of leg lift during step
  STEP_DURATION: 0.32,    // Time to complete one step (seconds)
  GAIT_THRESHOLD: 1.5,    // Distance deviation before triggering a step
  GAIT_RECOVERY: 1.5,     // Velocity prediction multiplier for step targeting
  MAX_STRIDE: 3.5,        // Maximum allowed step distance
  LEG_L1: 1.5,            // Upper leg length
  LEG_L2: 2.6,            // Lower leg length
  MAX_ACTIVE_STEPS: 3,    // Max legs allowed to lift simultaneously
  BREATHING_RATE: 2.0,    // Idle animation frequency
  BREATHING_AMP: 0.05,    // Idle animation amplitude
};
