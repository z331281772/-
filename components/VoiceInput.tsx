
import React, { useEffect, useRef } from 'react';

interface VoiceInputProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onRecordingComplete, isRecording, setIsRecording }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        onRecordingComplete(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("无法访问麦克风，请检查权限。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center animate-fade-in-up mt-8">
      <div className="relative group cursor-pointer" onClick={toggleRecording}>
        
        {/* Breathing Outer Ring (The "Call" ripple effect) */}
        <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${
            isRecording 
            ? 'bg-amber-400/30 animate-ping-slow' 
            : 'bg-white/10 opacity-0 group-hover:opacity-100 blur-md'
        }`} />
        
        {/* Second Ring */}
        {isRecording && (
             <div className="absolute inset-[-10px] rounded-full border border-amber-200/30 animate-pulse-ring"></div>
        )}

        <button
          className={`relative z-10 w-20 h-20 rounded-full border border-white/40 flex items-center justify-center transition-all duration-500 backdrop-blur-sm ${
            isRecording 
              ? 'bg-amber-500/20 scale-110 border-amber-200/60 shadow-[0_0_30px_rgba(255,200,100,0.5)]' 
              : 'bg-white/10 hover:bg-white/20 hover:scale-105'
          }`}
        >
           {isRecording ? (
             // Active Recording: Expanding Circles (Like a shout in Sky)
             <div className="relative w-full h-full flex items-center justify-center">
                 <div className="absolute w-2 h-2 bg-amber-100 rounded-full animate-ping"></div>
                 <div className="absolute w-12 h-12 border border-amber-200/50 rounded-full animate-pulse"></div>
             </div>
           ) : (
             // Mic Icon (Simple Diamond style or standard mic)
             <svg className="w-8 h-8 text-white/90 group-hover:text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
             </svg>
           )}
        </button>
      </div>
      
      <p className={`mt-4 text-[10px] tracking-[0.3em] font-light uppercase transition-all duration-500 ${isRecording ? 'text-amber-100 opacity-100 animate-pulse' : 'text-white/60 opacity-80'}`}>
        {isRecording ? "Listening..." : "Tap to Speak"}
      </p>

      <style>{`
        @keyframes ping-slow {
             0% { transform: scale(1); opacity: 0.6; }
             100% { transform: scale(2); opacity: 0; }
        }
        .animate-ping-slow {
             animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default VoiceInput;
