
import React from 'react';
import { BgConfig } from '../types';
import { BIOMES } from '../data/biomes';

interface BiomeSelectorProps {
  currentConfig: BgConfig;
  onSelect: (config: BgConfig) => void;
}

export const BiomeSelector: React.FC<BiomeSelectorProps> = ({ currentConfig, onSelect }) => {
  // Check if current config matches any preset exactly
  const activePreset = BIOMES.find(b => 
    JSON.stringify(b.config) === JSON.stringify(currentConfig)
  );
  
  // If no match (user tweaked sliders), we show 'custom'
  const selectedValue = activePreset ? activePreset.id : "custom";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const biome = BIOMES.find(b => b.id === e.target.value);
    if (biome) {
      onSelect(biome.config);
    }
  };

  return (
    <div className="pointer-events-auto bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-sm p-1 shadow-[0_0_20px_rgba(0,255,255,0.05)] hover:bg-black/60 transition-colors">
        <div className="flex items-center gap-4 px-3 py-1">
            <div className="flex flex-col">
                <label className="text-[9px] text-cyan-500/50 font-mono tracking-[0.2em] mb-0.5">
                    BIOME_PROTOCOL
                </label>
                <div className="relative">
                    <select 
                        value={selectedValue}
                        onChange={handleChange}
                        className="appearance-none bg-transparent text-cyan-300 text-xs font-mono outline-none border-none cursor-pointer hover:text-cyan-100 min-w-[160px] uppercase tracking-wide py-0.5 pr-4"
                    >
                        {/* Fallback option if state deviates from presets */}
                        {!activePreset && <option value="custom" disabled>⚠ MANUAL OVERRIDE</option>}
                        
                        {BIOMES.map(biome => (
                            <option key={biome.id} value={biome.id} className="bg-[#050510] text-cyan-400 py-1">
                                {biome.name}
                            </option>
                        ))}
                    </select>
                    {/* Custom Arrow */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6L0 0H8L4 6Z" fill="#06b6d4" fillOpacity="0.5"/>
                        </svg>
                    </div>
                </div>
            </div>
             <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${activePreset ? 'bg-cyan-500 animate-pulse text-cyan-500' : 'bg-orange-500 text-orange-500'}`}></div>
        </div>
    </div>
  );
};
