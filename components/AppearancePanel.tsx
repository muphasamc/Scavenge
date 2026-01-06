
import React, { useState } from 'react';
import { VisualConfig } from '../types';

interface VisualsPanelProps {
    config: VisualConfig;
    onChange: (newConfig: VisualConfig) => void;
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

const RangeControl: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (val: number) => void;
}> = ({ label, value, min, max, step, onChange }) => (
    <div className="space-y-1">
        <div className="flex justify-between text-[9px] text-cyan-500/50 font-mono">
            <span>{label}</span>
            <span>{value.toFixed(2)}</span>
        </div>
        <input 
            type="range" min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 h-1 bg-cyan-900/50 rounded-full appearance-none"
        />
    </div>
);

const VisualsPanel: React.FC<VisualsPanelProps> = ({ config, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const toggleBody = () => onChange({ ...config, showBody: !config.showBody });
    const togglePlating = () => onChange({ ...config, showPlating: !config.showPlating });
    const changeOpacity = (val: number) => onChange({ ...config, platingOpacity: val });
    
    const handleChange = (key: keyof VisualConfig, value: any) => {
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
        <div className="flex flex-col items-center group pointer-events-auto relative">
             {/* Panel Body */}
            {isOpen && (
                <div className="absolute bottom-0 right-14 bg-[#050510]/95 border border-cyan-500/30 p-4 rounded-sm backdrop-blur-md w-72 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-50 animate-in fade-in slide-in-from-right-4 duration-200 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4 border-b border-cyan-500/20 pb-2">
                        <h3 className="text-xs font-mono text-cyan-500">VISUAL SYSTEMS</h3>
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
                            <span className="text-[9px] opacity-50 animate-pulse text-green-400">● RENDER</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        
                        <CollapsibleSection title="CHASSIS & PLATING" defaultOpen={true}>
                            {/* Body Visibility */}
                            <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                                <span className="text-[9px] text-cyan-500/60 font-mono">MAIN CHASSIS</span>
                                <div 
                                    onClick={toggleBody}
                                    className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${config.showBody ? 'bg-cyan-900/80' : 'bg-white/10'}`}
                                >
                                    <div className={`w-3 h-3 bg-cyan-400 rounded-full shadow-lg transform transition-transform ${config.showBody ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                            </div>

                            {/* Plating Visibility */}
                            <div className="space-y-2 bg-black/20 p-2 rounded border border-white/5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-cyan-500/60 font-mono">LEG PLATING</span>
                                    <div 
                                        onClick={togglePlating}
                                        className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${config.showPlating ? 'bg-cyan-900/80' : 'bg-white/10'}`}
                                    >
                                        <div className={`w-3 h-3 bg-cyan-400 rounded-full shadow-lg transform transition-transform ${config.showPlating ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                                
                                {/* Opacity Slider */}
                                {config.showPlating && (
                                    <div className="pt-2 border-t border-white/5">
                                        <RangeControl label="OPACITY" value={config.platingOpacity} min={0} max={1} step={0.1} onChange={changeOpacity} />
                                    </div>
                                )}
                            </div>
                        </CollapsibleSection>

                        <CollapsibleSection title="OPTICAL SENSORS (HEAD)" defaultOpen={true}>
                             <div className="space-y-1 mb-3">
                                <span className="text-[9px] text-cyan-500/50 font-mono block">LIGHT COLOR</span>
                                <div className="flex items-center gap-2 bg-black/20 p-1 rounded border border-white/5">
                                    <input 
                                        type="color" 
                                        value={config.faceLightColor} 
                                        onChange={(e) => handleChange('faceLightColor', e.target.value)}
                                        className="bg-transparent w-full h-4 cursor-pointer"
                                    />
                                </div>
                            </div>
                            
                            <RangeControl label="INTENSITY" value={config.faceLightIntensity} min={0} max={20} step={0.5} onChange={(v) => handleChange('faceLightIntensity', v)} />
                            <RangeControl label="DISTANCE" value={config.faceLightDistance} min={2} max={50} step={1} onChange={(v) => handleChange('faceLightDistance', v)} />
                            <RangeControl label="ANGLE (SPREAD)" value={config.faceLightAngle} min={0.1} max={1.5} step={0.05} onChange={(v) => handleChange('faceLightAngle', v)} />
                            <RangeControl label="PENUMBRA (SOFTNESS)" value={config.faceLightPenumbra} min={0} max={1} step={0.1} onChange={(v) => handleChange('faceLightPenumbra', v)} />
                        </CollapsibleSection>

                        {/* Coming Soon */}
                         <div className="p-2 border border-dashed border-cyan-500/10 rounded opacity-50">
                            <span className="text-[9px] text-cyan-500/30 font-mono block text-center">SKINNING MODULE :: OFFLINE</span>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                w-12 h-12 border border-cyan-500/30 flex items-center justify-center 
                transition-all duration-300 hover:bg-cyan-500/20 backdrop-blur-sm
                ${isOpen ? 'bg-cyan-500/20 shadow-[0_0_15px_rgba(0,255,255,0.2)] border-cyan-500/60' : 'bg-black/40 opacity-60 hover:opacity-100'}
                `}
                title="Visual Settings"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={isOpen ? 'text-cyan-300' : 'text-cyan-500/70'}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            </button>
             <div className="text-[9px] text-cyan-500/40 font-mono text-center mt-1 tracking-widest bg-black/50 px-1">
                VISUALS
            </div>
        </div>
    );
};

export default VisualsPanel;
