
import React, { useState } from 'react';
import { BgConfig } from '../types';

interface ConfigPanelProps {
    config: BgConfig;
    onChange: (newConfig: BgConfig) => void;
}

const CollapsibleSection: React.FC<{ 
    title: string; 
    children: React.ReactNode; 
    defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-t border-cyan-500/10 pt-2 first:border-0 first:pt-0">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-[10px] text-cyan-300/60 font-mono tracking-wider hover:text-cyan-300 transition-colors py-1"
            >
                <span>{title}</span>
                <span className="opacity-50">{isOpen ? '[-]' : '[+]'}</span>
            </button>
            
            {isOpen && (
                <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
};

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleChange = (key: keyof BgConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy configuration", err);
        }
    };

    return (
        <div className="flex flex-col items-end gap-4 pointer-events-auto relative">
            {/* Panel Body */}
            {isOpen && (
                <div className="absolute bottom-0 right-14 bg-[#050510]/95 border border-cyan-500/30 p-4 rounded-sm backdrop-blur-md w-72 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-50 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4 border-b border-cyan-500/20 pb-2">
                        <h3 className="text-xs font-mono text-cyan-500">ATMOSPHERE CONTROLLER</h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCopy}
                                title="Copy configuration JSON to clipboard"
                                className={`
                                    text-[9px] px-1.5 py-0.5 rounded border transition-all duration-200 font-mono tracking-wide
                                    ${copied 
                                        ? 'border-green-500/50 text-green-400 bg-green-500/10' 
                                        : 'border-cyan-500/30 text-cyan-500/60 hover:text-cyan-300 hover:border-cyan-400/50 hover:bg-cyan-500/10'}
                                `}
                            >
                                {copied ? 'COPIED!' : 'COPY JSON'}
                            </button>
                            <span className="text-[9px] opacity-50 animate-pulse text-green-400">● LIVE</span>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        
                        {/* Sun Settings */}
                        <CollapsibleSection title="SOLAR DYNAMICS" defaultOpen={true}>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <span className="text-[9px] text-cyan-500/50 font-mono block">COLOR</span>
                                    <div className="flex items-center gap-2 bg-black/20 p-1 rounded border border-white/5">
                                        <input 
                                            type="color" 
                                            value={config.colorSun} 
                                            onChange={(e) => handleChange('colorSun', e.target.value)}
                                            className="bg-transparent w-full h-4 cursor-pointer"
                                        />
                                    </div>
                                </div>
                                 <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] text-cyan-500/50 font-mono">
                                        <span>ELEVATION</span>
                                        <span>{config.sunElevation.toFixed(2)}</span>
                                    </div>
                                    <input 
                                        type="range" min="-0.2" max="1.0" step="0.01"
                                        value={config.sunElevation}
                                        onChange={(e) => handleChange('sunElevation', parseFloat(e.target.value))}
                                        className="w-full accent-cyan-500 h-1 bg-cyan-900/50 rounded-full appearance-none mt-1"
                                    />
                                </div>
                            </div>

                            <div className="bg-black/20 p-2 rounded border border-white/5 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-cyan-500/50 font-mono">AZIMUTH</span>
                                    <div className="flex items-center gap-2">
                                        <label className="text-[8px] text-cyan-500/40 uppercase">Auto</label>
                                        <input 
                                            type="checkbox"
                                            checked={config.autoRotate}
                                            onChange={(e) => handleChange('autoRotate', e.target.checked)}
                                            className="accent-cyan-500 w-3 h-3"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between text-[8px] text-cyan-500/30 font-mono mb-1">
                                    <span>{config.sunAzimuth.toFixed(2)} rad</span>
                                </div>
                                <input 
                                    type="range" min="0" max={Math.PI * 2} step="0.01"
                                    value={config.sunAzimuth}
                                    onChange={(e) => handleChange('sunAzimuth', parseFloat(e.target.value))}
                                    disabled={config.autoRotate}
                                    className={`w-full h-1 rounded-full appearance-none ${config.autoRotate ? 'bg-cyan-900/20 cursor-not-allowed' : 'accent-cyan-500 bg-cyan-900/50'}`}
                                />
                            </div>

                             <div className="space-y-1">
                                <div className="flex justify-between text-[9px] text-cyan-500/50 font-mono">
                                    <span>HEAT DISTORTION</span>
                                    <span>{config.distortionStrength.toFixed(3)}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="0.02" step="0.001"
                                    value={config.distortionStrength}
                                    onChange={(e) => handleChange('distortionStrength', parseFloat(e.target.value))}
                                    className="w-full accent-cyan-500 h-1 bg-cyan-900/50 rounded-full appearance-none"
                                />
                            </div>
                        </CollapsibleSection>

                        {/* Terrain Settings */}
                         <CollapsibleSection title="TERRAIN SURFACE">
                             <div className="space-y-2">
                                <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                                    <span className="text-[9px] text-cyan-500/50 font-mono">TYPE</span>
                                    <select 
                                        value={config.terrainType}
                                        onChange={(e) => handleChange('terrainType', e.target.value)}
                                        className="bg-black/40 text-cyan-300 text-[10px] border border-cyan-500/30 rounded px-1 py-0.5 outline-none font-mono"
                                    >
                                        <option value="sand">SAND (PROCEDURAL)</option>
                                        <option value="ice">GLACIAL ICE</option>
                                        <option value="canyon">CANYON MESA</option>
                                        <option value="crystal">BISMUTH CRYSTAL</option>
                                        <option value="grid">RETRO GRID</option>
                                    </select>
                                </div>
                                <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                                    <span className="text-[9px] text-cyan-500/50 font-mono">COLOR</span>
                                    <input 
                                        type="color" 
                                        value={config.terrainColor} 
                                        onChange={(e) => handleChange('terrainColor', e.target.value)}
                                        className="bg-transparent w-6 h-6 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* Sky Settings */}
                        <CollapsibleSection title="ATMOSPHERE">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <span className="text-[9px] text-cyan-500/50 font-mono block">HORIZON</span>
                                    <div className="flex items-center gap-2 bg-black/20 p-1 rounded border border-white/5">
                                        <input 
                                            type="color" 
                                            value={config.colorHorizon} 
                                            onChange={(e) => handleChange('colorHorizon', e.target.value)}
                                            className="bg-transparent w-full h-4 cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-cyan-500/50 font-mono block">DEEP SPACE</span>
                                     <div className="flex items-center gap-2 bg-black/20 p-1 rounded border border-white/5">
                                        <input 
                                            type="color" 
                                            value={config.colorSpace} 
                                            onChange={(e) => handleChange('colorSpace', e.target.value)}
                                            className="bg-transparent w-full h-4 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CollapsibleSection>
                        
                        {/* Clouds Settings */}
                        <CollapsibleSection title="CLOUD LAYERS">
                             <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                                <span className="text-[9px] text-cyan-500/50 font-mono">CLOUD COLOR</span>
                                <input 
                                    type="color" 
                                    value={config.cloudColor} 
                                    onChange={(e) => handleChange('cloudColor', e.target.value)}
                                    className="bg-transparent w-6 h-6 cursor-pointer"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[9px] text-cyan-500/50 font-mono">
                                    <span>DENSITY (COUNT)</span>
                                    <span>{config.cloudCount}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="100" step="1"
                                    value={config.cloudCount}
                                    onChange={(e) => handleChange('cloudCount', parseFloat(e.target.value))}
                                    className="w-full accent-cyan-500 h-1 bg-cyan-900/50 rounded-full appearance-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[9px] text-cyan-500/50 font-mono">
                                    <span>ALTITUDE</span>
                                    <span>{config.cloudAltitude}m</span>
                                </div>
                                <input 
                                    type="range" min="20" max="200" step="5"
                                    value={config.cloudAltitude}
                                    onChange={(e) => handleChange('cloudAltitude', parseFloat(e.target.value))}
                                    className="w-full accent-cyan-500 h-1 bg-cyan-900/50 rounded-full appearance-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[9px] text-cyan-500/50 font-mono">
                                    <span>OPACITY</span>
                                    <span>{config.cloudOpacity.toFixed(2)}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="1" step="0.05"
                                    value={config.cloudOpacity}
                                    onChange={(e) => handleChange('cloudOpacity', parseFloat(e.target.value))}
                                    className="w-full accent-cyan-500 h-1 bg-cyan-900/50 rounded-full appearance-none"
                                />
                            </div>
                             <div className="space-y-1">
                                <div className="flex justify-between text-[9px] text-cyan-500/50 font-mono">
                                    <span>DRIFT SPEED</span>
                                    <span>{config.cloudSpeed.toFixed(1)}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="10" step="0.1"
                                    value={config.cloudSpeed}
                                    onChange={(e) => handleChange('cloudSpeed', parseFloat(e.target.value))}
                                    className="w-full accent-cyan-500 h-1 bg-cyan-900/50 rounded-full appearance-none"
                                />
                            </div>
                        </CollapsibleSection>

                        {/* Dust Settings */}
                        <CollapsibleSection title="PARTICULATE MATTER">
                             <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                                <span className="text-[9px] text-cyan-500/50 font-mono">DUST COLOR</span>
                                <input 
                                    type="color" 
                                    value={config.dustColor} 
                                    onChange={(e) => handleChange('dustColor', e.target.value)}
                                    className="bg-transparent w-6 h-6 cursor-pointer"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[9px] text-cyan-500/50 font-mono">
                                    <span>COUNT (DENSITY)</span>
                                    <span>{config.dustCount}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="10000" step="100"
                                    value={config.dustCount}
                                    onChange={(e) => handleChange('dustCount', parseFloat(e.target.value))}
                                    className="w-full accent-cyan-500 h-1 bg-cyan-900/50 rounded-full appearance-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[9px] text-cyan-500/50 font-mono">
                                    <span>SPREAD RADIUS</span>
                                    <span>{config.dustRadius}m</span>
                                </div>
                                <input 
                                    type="range" min="20" max="250" step="5"
                                    value={config.dustRadius}
                                    onChange={(e) => handleChange('dustRadius', parseFloat(e.target.value))}
                                    className="w-full accent-cyan-500 h-1 bg-cyan-900/50 rounded-full appearance-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[9px] text-cyan-500/50 font-mono">
                                    <span>OPACITY</span>
                                    <span>{config.dustOpacity.toFixed(2)}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="1" step="0.05"
                                    value={config.dustOpacity}
                                    onChange={(e) => handleChange('dustOpacity', parseFloat(e.target.value))}
                                    className="w-full accent-cyan-500 h-1 bg-cyan-900/50 rounded-full appearance-none"
                                />
                            </div>
                             <div className="space-y-1">
                                <div className="flex justify-between text-[9px] text-cyan-500/50 font-mono">
                                    <span>FLOW SPEED</span>
                                    <span>{config.dustSpeed.toFixed(1)}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="5" step="0.1"
                                    value={config.dustSpeed}
                                    onChange={(e) => handleChange('dustSpeed', parseFloat(e.target.value))}
                                    className="w-full accent-cyan-500 h-1 bg-cyan-900/50 rounded-full appearance-none"
                                />
                            </div>
                        </CollapsibleSection>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <div className="flex flex-col items-center group">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                    w-12 h-12 border border-cyan-500/30 flex items-center justify-center 
                    transition-all duration-300 hover:bg-cyan-500/20 backdrop-blur-sm
                    ${isOpen ? 'bg-cyan-500/20 shadow-[0_0_15px_rgba(0,255,255,0.2)] border-cyan-500/60' : 'bg-black/40 opacity-60 hover:opacity-100'}
                    `}
                    title="Environment Settings"
                >
                    <div className="w-4 h-4 grid grid-cols-2 gap-1 transition-transform duration-500 group-hover:rotate-90">
                        <div className={`w-1.5 h-1.5 ${isOpen ? 'bg-cyan-300' : 'bg-cyan-500/50'}`}></div>
                        <div className={`w-1.5 h-1.5 ${isOpen ? 'bg-cyan-300' : 'bg-cyan-500/50'}`}></div>
                        <div className={`w-1.5 h-1.5 ${isOpen ? 'bg-cyan-300' : 'bg-cyan-500/50'}`}></div>
                        <div className={`w-1.5 h-1.5 ${isOpen ? 'bg-cyan-300' : 'bg-cyan-500/50'}`}></div>
                    </div>
                </button>
                 <div className="text-[9px] text-cyan-500/40 font-mono text-center mt-1 tracking-widest bg-black/50 px-1">
                   EDITOR
                 </div>
            </div>
        </div>
    );
};

export default ConfigPanel;