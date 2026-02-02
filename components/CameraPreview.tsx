
import React, { useRef, useEffect } from 'react';
import { AppState } from '../types';

interface CameraPreviewProps {
  appState: AppState;
  onCaptureRef?: (captureFn: () => string | null) => void;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({ appState, onCaptureRef }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isActive = appState === AppState.RECORDING || 
                   appState === AppState.ANALYZING;
  
  const isAnalyzing = appState === AppState.ANALYZING;

  useEffect(() => {
    if (onCaptureRef) {
      onCaptureRef(() => {
        const video = videoRef.current;
        if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return null;
        
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = video.videoWidth;
        captureCanvas.height = video.videoHeight;
        captureCanvas.getContext('2d')?.drawImage(video, 0, 0);
        return captureCanvas.toDataURL('image/jpeg', 0.8);
      });
    }
  }, [onCaptureRef]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isActive) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(e => console.error("Video play failed", e));
          }
        })
        .catch(err => console.error("Camera error:", err));
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const render = () => {
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();

        // Stylize: Golden Hour Filter / Memory Filter
        // Overlay a warm gold/orange tint
        ctx.fillStyle = isAnalyzing ? 'rgba(255, 220, 180, 0.2)' : 'rgba(255, 240, 200, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add "Candle Light" flicker effect
        const time = Date.now() / 1000;
        const flicker = 0.05 + Math.sin(time * 10) * 0.02;
        
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 50,
            canvas.width / 2, canvas.height / 2, canvas.width / 1.5
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
        gradient.addColorStop(1, `rgba(255, 200, 100, ${0.1 + flicker})`); // Vignette
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, [isActive, isAnalyzing]);

  if (!isActive) return null;

  return (
    <div className={`absolute top-[15%] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
      <video ref={videoRef} playsInline muted className="hidden" />
      
      {/* Container with "Spirit Memory" Effects */}
      <div className="relative">
          <div className="absolute inset-0 flex justify-center items-center overflow-visible pointer-events-none">
             {/* Background Glow - Warm Light */}
             <div className={`absolute w-[400px] h-[400px] rounded-full bg-gradient-to-r ${isAnalyzing ? 'from-amber-200/20 to-orange-200/20' : 'from-yellow-100/10 to-amber-100/10'} blur-3xl -z-10 transition-colors duration-1000`}></div>
             
             {/* Vertical Beam - Like a beacon */}
             <div className={`absolute w-[100px] h-[500px] bg-gradient-to-b ${isAnalyzing ? 'from-amber-100/20' : 'from-white/10'} to-transparent top-1/2 left-1/2 -translate-x-1/2 blur-2xl transition-colors duration-1000`}></div>
          </div>

          {/* The Mirror/Portal Frame */}
          <div className={`relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden transition-all duration-1000 ${
              isAnalyzing 
              ? 'ring-2 ring-amber-200/60 shadow-[0_0_80px_rgba(255,200,100,0.4)] scale-95' 
              : 'ring-1 ring-white/30 shadow-[0_0_50px_rgba(255,255,255,0.2)]'
          }`}>
            <canvas ref={canvasRef} width={300} height={300} className="w-full h-full object-cover opacity-90" />
            
            {/* Soft vignette overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(255,230,200,0.2)_100%)] pointer-events-none" />
            
            {/* Diamond/Star Icon for Analysis */}
            {isAnalyzing && (
                <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
                    {/* Diamond Shape */}
                    <div className="w-24 h-24 border-[1px] border-amber-100/50 rotate-45 animate-pulse-slow"></div>
                    <div className="absolute w-16 h-16 border-[1px] border-white/60 rotate-45 animate-spin-slow"></div>
                    <span className="absolute text-amber-100/90 tracking-[0.3em] text-[10px] font-bold mt-32 blur-[0.5px]">回 忆 中</span>
                </div>
            )}
          </div>
      </div>
      
      {/* Text */}
      <p className={`mt-8 text-[12px] tracking-[0.4em] uppercase transition-colors duration-500 font-normal ${isAnalyzing ? 'text-amber-100 drop-shadow-[0_0_10px_rgba(255,200,100,0.5)]' : 'text-white/60'}`}>
          {isAnalyzing ? 'Awakening Spirit' : 'Reflect Your Light'}
      </p>

      <style>{`
        .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-spin-slow { animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: rotate(45deg); } to { transform: rotate(405deg); } }
      `}</style>
    </div>
  );
};

export default CameraPreview;
