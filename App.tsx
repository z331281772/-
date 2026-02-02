
import React, { useState, useRef } from 'react';
import Scene from './components/Scene';
import FogLayer from './components/FogLayer';
import UIOverlay from './components/UIOverlay';
import Cursor from './components/Cursor';
import CameraPreview from './components/CameraPreview';
import { AppState, UserAppearance } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.FOGGY);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [appearance, setAppearance] = useState<UserAppearance | null>(null);
  
  // Ref to hold the capture function from CameraPreview
  const captureRef = useRef<() => string | null>(undefined);

  return (
    <div className="relative w-full h-screen overflow-hidden custom-cursor-area">
      {/* Layer 0: Main Background Gradient - Sky Style (Clear Blue -> Pink -> Warm Gold) */}
      <div className={`absolute inset-0 transition-opacity duration-[3000ms] ease-in-out z-0 bg-gradient-to-b from-[#4ca1af] via-[#c4e0e5] to-[#fbc2eb] ${appState === AppState.FOGGY ? 'opacity-0' : 'opacity-100'}`} />
      
      {/* Foggy State Background (Darker/Misty) */}
      <div className={`absolute inset-0 bg-[#a8c0ff] transition-opacity duration-[3000ms] -z-10 ${appState === AppState.FOGGY ? 'opacity-100' : 'opacity-0'}`} />

      {/* Layer 2: Three.js 3D Scene */}
      <div className="absolute inset-0 z-10 transition-opacity duration-1000 opacity-100">
        <Scene 
            appState={appState} 
            isSpeaking={isSpeaking} 
            appearance={appearance}
        />
      </div>

      {/* Layer 3: Camera Preview - Handles its own positioning/visibility based on state */}
      <CameraPreview 
        appState={appState}
        onCaptureRef={(fn) => { captureRef.current = fn; }}
      />

      {/* Layer 4: Interactive Fog Layer */}
      <div className="absolute inset-0 z-20">
         <FogLayer appState={appState} setAppState={setAppState} />
      </div>

      {/* Layer 5: UI Overlay */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        <UIOverlay 
          appState={appState} 
          setAppState={setAppState} 
          setIsSpeaking={setIsSpeaking}
          captureRef={captureRef}
          onAppearanceAnalyzed={setAppearance}
        />
      </div>
      
      {/* Layer 7: Custom Cursor */}
      <Cursor />

      {/* Global Styles */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 40px)); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
        @keyframes fadeInUpText {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in-up {
          animation: fadeInUpText 1.0s ease-out forwards;
        }
        .animate-fade-in {
            animation: fadeIn 2s ease-out forwards;
        }
        @keyframes subtle-pulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.6); }
            70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
        .animate-pulse-ring {
            animation: subtle-pulse 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
