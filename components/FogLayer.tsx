
import React, { useRef, useEffect } from 'react';
import { AppState } from '../types';
import { audioService } from '../services/audioService';

interface FogLayerProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
}

const FogLayer: React.FC<FogLayerProps> = ({ appState, setAppState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const throttleRef = useRef<number>(0);
  const audioContextInitialized = useRef(false);

  // Helper to determine if the fog layer should be active/visible.
  // The fog should only exist in the initial FOGGY state or while CLEARING.
  // Once AWAKENED or any subsequent state (RECORDING, etc.) is reached, it should remain gone.
  const isFogActive = appState === AppState.FOGGY || appState === AppState.CLEARING;

  // Initialize Fog
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Only draw the fog if we are in an active fog state
      if (isFogActive) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Fill with Milky White - Slightly reduced opacity (0.95 -> 0.85)
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(240, 240, 250, 0.85)'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for(let i=0; i<500; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 3;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI*2);
            ctx.fill();
        }
      } else {
          // If not active, ensure canvas is clear
          ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    window.addEventListener('resize', resize);
    resize();

    return () => window.removeEventListener('resize', resize);
  }, [appState, isFogActive]);

  // Check percentage cleared
  const checkClearPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Performance optimization: sample using a small temporary canvas
    const w = canvas.width;
    const h = canvas.height;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 100;
    tempCanvas.height = 100 * (h/w);
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    // Draw current canvas onto temp canvas
    tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const pixels = imageData.data;
    
    let clearedCount = 0;
    for (let i = 0; i < pixels.length; i += 4) {
        const alpha = pixels[i + 3];
        if (alpha < 128) clearedCount++;
    }
    
    const percent = (clearedCount / (pixels.length / 4)) * 100;
    
    if (percent > 40 && isFogActive) {
        setAppState(AppState.AWAKENED);
        audioService.playSingingBowl();
    }
  };

  const draw = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    const radius = 80;
    const gradient = ctx.createRadialGradient(x, y, 10, x, y, radius);
    gradient.addColorStop(0, 'rgba(0,0,0,1)'); 
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = gradient;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (lastPos.current) {
        const dx = x - lastPos.current.x;
        const dy = y - lastPos.current.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 20 && Math.random() > 0.6) {
            audioService.playChime();
        }
    }
    lastPos.current = { x, y };
  };

  const handleInteractionStart = () => {
      if (appState === AppState.FOGGY) setAppState(AppState.CLEARING);
      
      // Ensure audio context is unlocked on first interaction
      if (!audioContextInitialized.current) {
          audioService.resume();
          audioContextInitialized.current = true;
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isFogActive) return;
    handleInteractionStart();
    draw(e.clientX, e.clientY);
    throttledCheck();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isFogActive) return;
    handleInteractionStart();
    const touch = e.touches[0];
    draw(touch.clientX, touch.clientY);
    throttledCheck();
  };

  const throttledCheck = () => {
    const now = Date.now();
    if (now - throttleRef.current > 300) {
        checkClearPercentage();
        throttleRef.current = now;
    }
  };

  return (
    <div 
        ref={containerRef}
        className={`absolute inset-0 z-20 transition-all duration-[2000ms] ease-in-out ${
            !isFogActive ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100'
        }`}
    >
        <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onTouchStart={handleInteractionStart}
            // Ensure audio unlock on simple click too
            onMouseDown={handleInteractionStart}
            style={{ 
                touchAction: 'none',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)'
            }}
            className="w-full h-full cursor-none"
        />
    </div>
  );
};

export default FogLayer;
