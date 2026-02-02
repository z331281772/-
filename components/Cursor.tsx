
import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  alpha: number;
}

const Cursor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -100, y: -100 });
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number>(0);
  const lastMouseRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Use "lighter" for that glowing overlapping effect without losing visibility on white
      ctx.globalCompositeOperation = 'lighter';

      const dx = mouseRef.current.x - lastMouseRef.current.x;
      const dy = mouseRef.current.y - lastMouseRef.current.y;
      const speed = Math.sqrt(dx*dx + dy*dy);

      const targetX = mouseRef.current.x;
      const targetY = mouseRef.current.y;

      // Emit Golden Particles (Sky "Light" Energy)
      if (speed > 1 || Math.random() > 0.9) {
          const emitCount = Math.min(Math.floor(speed / 3), 4) + 1;
          for(let i=0; i<emitCount; i++) {
            if (mouseRef.current.x > 0) { 
                const life = 1.0 + Math.random() * 0.8;
                particlesRef.current.push({
                    x: targetX + (Math.random() - 0.5) * 10,
                    y: targetY + (Math.random() - 0.5) * 10,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5 + 0.5, // Slight upward drift like candle smoke/light
                    life: life,
                    maxLife: life,
                    size: 3 + Math.random() * 5, 
                    alpha: 0.6 + Math.random() * 0.4 
                });
            }
          }
      }

      lastMouseRef.current = { ...mouseRef.current };

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        const opacity = (p.life / p.maxLife) * p.alpha;
        
        // Golden/Amber Gradient
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(255, 215, 0, ${opacity})`); // Gold core
        gradient.addColorStop(0.4, `rgba(255, 140, 0, ${opacity * 0.6})`); // Orange/Amber halo
        gradient.addColorStop(1, 'rgba(255, 140, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Main Cursor: Glowing Star
      if (mouseRef.current.x > 0) {
          // Diamond shape for the cursor core
          const size = 12;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.moveTo(mouseRef.current.x, mouseRef.current.y - size);
          ctx.lineTo(mouseRef.current.x + size/1.5, mouseRef.current.y);
          ctx.lineTo(mouseRef.current.x, mouseRef.current.y + size);
          ctx.lineTo(mouseRef.current.x - size/1.5, mouseRef.current.y);
          ctx.closePath();
          ctx.fill();
          
          // Outer Glow
          const cursorGradient = ctx.createRadialGradient(
              mouseRef.current.x, mouseRef.current.y, 5, 
              mouseRef.current.x, mouseRef.current.y, 25
          );
          cursorGradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
          cursorGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
          
          ctx.fillStyle = cursorGradient;
          ctx.beginPath();
          ctx.arc(mouseRef.current.x, mouseRef.current.y, 25, 0, Math.PI * 2);
          ctx.fill();
      }
      
      ctx.globalCompositeOperation = 'source-over';
      requestRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      // Removed mix-blend-screen to ensure it is visible on bright backgrounds
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-50"
    />
  );
};

export default Cursor;
