
import { BgConfig } from '../types';

export interface BiomePreset {
  id: string;
  name: string;
  config: BgConfig;
}

/**
 * BIOME CONFIGURATION DOCUMENTATION
 * -------------------------------
 * 
 * colorSpace:       Top gradient color of the skybox. Represents deep space/zenith.
 * colorHorizon:     Bottom gradient color of the skybox & fog color. Matches terrain blend.
 * colorSun:         The color of the directional light and the sun disk in the sky shader.
 * sunElevation:     Height of sun (0.0 = Horizon, 1.0 = Zenith).
 * sunAzimuth:       Horizontal rotation of the sun around the scene (Radians).
 * autoRotate:       If true, azimuth slowly cycles.
 * distortionStrength: Intensity of the heat haze effect near horizon.
 * 
 * dustOpacity:      Alpha transparency of dust particles (0.0 - 1.0).
 * dustSpeed:        Downward and sway velocity of particles.
 * dustCount:        Number of active particles (0 - 10000). Controls raw quantity.
 * dustRadius:       Radius from camera where particles exist. Lower radius = Higher density.
 * dustColor:        Tint color for the dust particles.
 * 
 * cloudColor:       Color of the procedural clouds.
 * cloudOpacity:     Transparency of clouds.
 * cloudCount:       Number of cloud clusters.
 * cloudAltitude:    Height above y=0.
 * cloudSpeed:       Drift speed.
 * 
 * terrainColor:     Base color of the procedural sand or grid lines.
 * terrainType:      'sand' for procedural noise terrain, 'grid' for retro wireframe.
 */

export const BIOMES: BiomePreset[] = [
  {
    id: 'desert',
    name: 'SCORCHED DESERT',
    config: {
      colorSpace: "#ff0f0f",
      colorHorizon: "#fea4a4",
      colorSun: "#ffa200",
      sunElevation: 0.16,
      sunAzimuth: 3.24,
      autoRotate: false,
      distortionStrength: 0.015,
      dustOpacity: 0.75,
      dustSpeed: 0.5,
      dustCount: 7500,
      dustRadius: 110,
      dustColor: "#fff700",
      
      cloudColor: "#ffeeb0",
      cloudOpacity: 0.45,
      cloudCount: 40,
      cloudAltitude: 90,
      cloudSpeed: 1.5,

      terrainColor: "#cd5c0c",
      terrainType: "sand"
    }
  },
  {
    id: 'volcanic',
    name: 'VOLCANIC ASHLANDS',
    config: {
      colorSpace: "#000000",
      colorHorizon: "#cc3333",
      colorSun: "#9f7575",
      sunElevation: 0.16,
      sunAzimuth: 5.48,
      autoRotate: false,
      distortionStrength: 0.002,
      dustOpacity: 0.75,
      dustSpeed: 0.5,
      dustCount: 7500,
      dustRadius: 110, 
      dustColor: "#ff5900",

      cloudColor: "#1a0505",
      cloudOpacity: 0.7,
      cloudCount: 60,
      cloudAltitude: 70,
      cloudSpeed: 3.0,

      terrainColor: "#c6542f",
      terrainType: "sand"
    }
  },
  {
    id: 'arctic_zero',
    name: 'ARCTIC ZERO',
    config: {
      colorSpace: "#000510",
      colorHorizon: "#aaccff",
      colorSun: "#ffffff",
      sunElevation: 0.1,
      sunAzimuth: 4.2,
      autoRotate: false,
      distortionStrength: 0.0,
      dustOpacity: 0.6,
      dustSpeed: 3.5, // Blizzard speed
      dustCount: 9000,
      dustRadius: 90,
      dustColor: "#ffffff",

      cloudColor: "#eef6ff",
      cloudOpacity: 0.6,
      cloudCount: 70,
      cloudAltitude: 60,
      cloudSpeed: 8.0,

      terrainColor: "#88ccff",
      terrainType: "ice"
    }
  },
  {
    id: 'mars_canyon',
    name: 'MARS CANYON',
    config: {
      colorSpace: "#331100",
      colorHorizon: "#d17c55",
      colorSun: "#ffaa88",
      sunElevation: 0.45,
      sunAzimuth: 1.2,
      autoRotate: false,
      distortionStrength: 0.008,
      dustOpacity: 0.5,
      dustSpeed: 0.8,
      dustCount: 6000,
      dustRadius: 120,
      dustColor: "#ffccaa",

      cloudColor: "#ffddcc",
      cloudOpacity: 0.4,
      cloudCount: 35,
      cloudAltitude: 85,
      cloudSpeed: 2.0,

      terrainColor: "#b35934",
      terrainType: "canyon"
    }
  },
  {
    id: 'electric_bogaloo',
    name: 'ELECTRIC BOGALOO',
    config: {
      colorSpace: "#ff00dd",
      colorHorizon: "#999400",
      colorSun: "#7bff24",
      sunElevation: 0.33,
      sunAzimuth: 1.27,
      autoRotate: true,
      distortionStrength: 0,
      dustOpacity: 1,
      dustSpeed: 0.5,
      dustCount: 4000,
      dustRadius: 160,
      dustColor: "#00fffb",
      
      cloudColor: "#660066",
      cloudOpacity: 0.3,
      cloudCount: 20,
      cloudAltitude: 100,
      cloudSpeed: 1,

      terrainColor: "#ffc800",
      terrainType: "crystal"
    }
  },
  {
    id: 'dirt_day',
    name: 'TERRA FIRMA (DAY)',
    config: {
      colorSpace: "#0f97ff",
      colorHorizon: "#e8e8e8",
      colorSun: "#c9c9c9",
      sunElevation: 0.63,
      sunAzimuth: 3.141592653589793,
      autoRotate: false,
      distortionStrength: 0.003,
      dustOpacity: 0.75,
      dustSpeed: 0.5,
      dustCount: 7500,
      dustRadius: 110,
      dustColor: "#ffffff",

      cloudColor: "#ffffff",
      cloudOpacity: 0.35,
      cloudCount: 50,
      cloudAltitude: 100,
      cloudSpeed: 1.0,

      terrainColor: "#aa8755",
      terrainType: "sand"
    }
  },
  {
    id: 'nuclear',
    name: 'NUCLEAR FALLOUT',
    config: {
        colorSpace: "#000000",
        colorHorizon: "#039d01",
        colorSun: "#56cd23",
        sunElevation: 0.16,
        sunAzimuth: 3.7715,
        autoRotate: true,
        distortionStrength: 0,
        dustOpacity: 0.7,
        dustSpeed: 1.5,
        dustCount: 7900,
        dustRadius: 115,
        dustColor: "#a6c700",

        cloudColor: "#0dfd95",
        cloudOpacity: 0.35,
        cloudCount: 40,
        cloudAltitude: 55,
        cloudSpeed: 10,

        terrainColor: "#cd5c0c",
        terrainType: 'sand'
    }
  }
];
