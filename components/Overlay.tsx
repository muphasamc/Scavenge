
import React, { useState } from 'react';
import { Vector3 } from 'three';
import ConfigPanel from './ConfigPanel';
import VisualsPanel from './AppearancePanel';
import PhysicsPanel from './PhysicsPanel';
import { BiomeSelector } from './BiomeSelector';
import { BgConfig, VisualConfig, PhysicsConfig } from '../types';

interface OverlayProps {
  target: Vector3;
  marker: Vector3;
  config: BgConfig;
  onConfigChange: (newConfig: BgConfig) => void;
  isLocked: boolean;
  onLockToggle: () => void;
  visualConfig: VisualConfig;
  onVisualConfigChange: (newConfig: VisualConfig) => void;
  physicsConfig: PhysicsConfig;
  onPhysicsConfigChange: (newConfig: PhysicsConfig) => void;
}

/**
 * Overlay Component
 * Handles the 2D UI layer sitting on top of the 3D canvas.
 * Includes HUD elements, status indicators, and the configuration panel.
 */
const Overlay: React.FC<OverlayProps> = ({
  target,
  marker,
  config,
  onConfigChange,
  isLocked,
  onLockToggle,
  visualConfig,
  onVisualConfigChange,
  physicsConfig,
  onPhysicsConfigChange
}) => {
  const [debugOpen, setDebugOpen] = useState(false);

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 p-8 flex flex-col justify-between">
      {/* Top Header: System Status & Coordinates */}
      <div className="flex justify-between items-start w-full">
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-white font-mono text-[10px] tracking-[0.2em]">
              <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
              SYSTEM ONLINE // KINEMATICS ENGINE
              <span className="text-white/50 ml-2">v1.0.0</span>
            </div>
            <div className="font-mono text-xs text-white/80 shadow-black drop-shadow-sm">
            <p>LAT: {target.x.toFixed(2)}</p>
            <p>LNG: {target.z.toFixed(2)}</p>
            <p>ELEV: {marker.y.toFixed(2)}</p>
            </div>
        </div>

        {/* Top Right: Biome Selector (Official UI) */}
        <BiomeSelector currentConfig={config} onSelect={onConfigChange} />
      </div>

      {/* Bottom Footer: Instructions & Decor */}
      <div className="flex justify-between items-end">
        <div className="max-w-md font-mono text-xs text-blue-200/40 leading-relaxed tracking-wide">
          <p className="mb-2 text-white/80 border-l-2 border-cyan-500/50 pl-2 shadow-black drop-shadow-md">
            LMB: SET DESTINATION // RMB: CAMERA CONTROL
          </p>
        </div>

        <div className="flex gap-1 opacity-50">
          <div className="w-16 h-1 bg-cyan-900/40"></div>
          <div className="w-4 h-1 bg-cyan-500/80"></div>
          <div className="w-2 h-1 bg-cyan-200"></div>
        </div>
      </div>

      {/* Bottom Right: Interactive Controls */}
      <div className="absolute bottom-8 right-8 flex flex-col items-center gap-4 pointer-events-auto">
        
        {/* Collapsible Debug Menu Items */}
        <div className={`
            flex flex-col items-center gap-4 transition-all duration-300 ease-out origin-bottom
            ${debugOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none absolute bottom-16'}
        `}>
            {/* Environment Config Panel */}
            <div className="pointer-events-auto">
            <ConfigPanel config={config} onChange={onConfigChange} />
            </div>
            
            {/* Physics Config Panel */}
            <div className="pointer-events-auto">
            <PhysicsPanel config={physicsConfig} onChange={onPhysicsConfigChange} />
            </div>

            {/* Visual Appearance Panel */}
            <div className="pointer-events-auto">
            <VisualsPanel config={visualConfig} onChange={onVisualConfigChange} />
            </div>

            {/* Camera Tracking Toggle */}
            <div className="flex flex-col items-center group pointer-events-auto">
            <button
                onClick={onLockToggle}
                className={`
                w-12 h-12 border border-cyan-500/30 flex items-center justify-center 
                transition-all duration-300 hover:bg-cyan-500/20 backdrop-blur-sm
                ${isLocked ? 'bg-cyan-500/20 shadow-[0_0_15px_rgba(0,255,255,0.2)] border-cyan-500/60' : 'bg-black/40 opacity-60 hover:opacity-100'}
                `}
                title={isLocked ? "Unlock Camera" : "Lock Camera"}
            >
                <div className={`w-3 h-3 ${isLocked ? 'bg-cyan-300' : 'border border-cyan-300/50'} rounded-sm transition-all duration-300`} />
            </button>
            <div className="text-[9px] text-cyan-500/40 font-mono text-center mt-1 tracking-widest bg-black/50 px-1">
                {isLocked ? 'TRACKING' : 'FREE CAM'}
            </div>
            </div>
        </div>

        {/* Master Debug Toggle Button */}
        <div className="flex flex-col items-center group pointer-events-auto z-20 mt-2">
            <button
                onClick={() => setDebugOpen(!debugOpen)}
                className={`
                w-12 h-12 border border-cyan-500/30 flex items-center justify-center 
                transition-all duration-300 hover:bg-cyan-500/20 backdrop-blur-sm
                ${debugOpen ? 'bg-cyan-500/20 shadow-[0_0_15px_rgba(0,255,255,0.2)] border-cyan-500/60' : 'bg-black/40 opacity-60 hover:opacity-100'}
                `}
                title="Toggle Debug Tools"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={debugOpen ? 'text-cyan-300' : 'text-cyan-500/70'}>
                    <path d="M4 17l6-6-6-6M12 19h8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
            <div className="text-[9px] text-cyan-500/40 font-mono text-center mt-1 tracking-widest bg-black/50 px-1">
                DEBUG
            </div>
        </div>

      </div>
    </div>
  );
};

export default Overlay;
