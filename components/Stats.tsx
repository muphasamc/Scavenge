
import React, { useEffect, useRef } from 'react';

export const Stats = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 0;
    const history: number[] = new Array(60).fill(60);

    const tick = () => {
      const time = performance.now();
      frameCount++;

      if (time >= lastTime + 1000) {
        fps = frameCount;
        frameCount = 0;
        lastTime = time;
        
        // Update history
        history.shift();
        history.push(fps);
      }

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, 80, 40);

      // Text
      ctx.fillStyle = '#00ffff';
      ctx.font = '10px monospace';
      ctx.fillText(`FPS: ${fps}`, 5, 12);
      
      // Memory (if available in Chrome)
      const memory = (performance as any).memory;
      if (memory) {
         const memVal = Math.round(memory.usedJSHeapSize / 1048576);
         ctx.fillText(`MEM: ${memVal}MB`, 5, 24);
      }

      // Graph
      ctx.beginPath();
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1;
      
      history.forEach((val, i) => {
        const x = 5 + i; // 60px wide
        const y = 35 - (val / 120) * 30; // Normalize 120fps to height
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      requestAnimationFrame(tick);
    };

    const frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="absolute top-4 left-4 z-50 pointer-events-none">
      <canvas ref={canvasRef} width={80} height={40} className="border border-cyan-500/30 rounded" />
    </div>
  );
};
