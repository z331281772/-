
import React from 'react';

export type ProblemType = 'fog' | 'mask' | 'hourglass' | 'tangle' | 'custom';

export interface ProblemOption {
  id: ProblemType;
  icon: string;
  title: string;
  description: string;
}

export const OPTIONS: ProblemOption[] = [
  { 
    id: 'fog', 
    icon: '🌁', 
    title: '迷 雾', 
    description: '我对未来毫无头绪，只有无尽的空白。' 
  },
  { 
    id: 'mask', 
    icon: '🎭', 
    title: '面 具', 
    description: '我疲于应对社交和期待，快要找不到真实的自己。' 
  },
  { 
    id: 'hourglass', 
    icon: '⏳', 
    title: '漏 斗', 
    description: '时间在飞逝，我却感觉被困在原地，一事无成。' 
  },
  { 
    id: 'tangle', 
    icon: '🕸️', 
    title: '乱 麻', 
    description: '内耗和焦虑像杂草一样，占据了我所有的情绪。' 
  },
  { 
    id: 'custom', 
    icon: '🗣️', 
    title: '我有话说', 
    description: '并没有特定的形状，我只想说出此时此刻的感受。' 
  },
];

interface ProblemSelectionProps {
  onSelect: (id: ProblemType) => void;
  onHover?: (option: ProblemOption | null) => void;
}

const ProblemSelection: React.FC<ProblemSelectionProps> = ({ onSelect, onHover }) => {
  return (
    <div className="flex flex-wrap justify-center items-start gap-4 md:gap-8 max-w-7xl w-full px-2 mt-4">
      {OPTIONS.map((opt, index) => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          onMouseEnter={() => onHover && onHover(opt)}
          onMouseLeave={() => onHover && onHover(null)}
          className="group relative flex flex-col items-center justify-center perspective-500"
          style={{ 
              animation: `float-bubble ${4 + index}s ease-in-out infinite`, 
              animationDelay: `${index * 0.5}s` 
          }}
        >
          {/* Bubble Container - Sky Style: Light, translucent, iridescent */}
          <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full transition-all duration-300 transform group-hover:scale-110 group-hover:-translate-y-2 group-active:scale-95">
             
             {/* Base Glass Layer - Warmer tint */}
             <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-white/10 to-transparent backdrop-blur-[4px] border border-white/40 group-hover:border-white/60 transition-colors" />
             
             {/* Inner Highlight Ring */}
             <div className="absolute inset-[2px] rounded-full border border-white/20 opacity-50" />

             {/* Top Specular Highlight */}
             <div className="absolute top-4 left-6 w-1/3 h-1/5 rounded-[100%] bg-gradient-to-b from-white to-transparent blur-[1px] opacity-90" />

             {/* Bottom Reflection Light (Warm Gold/Pink) */}
             <div className="absolute bottom-2 right-4 w-1/2 h-1/3 rounded-[100%] bg-gradient-to-t from-amber-200/40 to-transparent blur-[5px] opacity-80" />

             {/* Icon floating inside */}
             <div className="absolute inset-0 flex items-center justify-center text-3xl md:text-4xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] opacity-90 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 duration-300 grayscale-[0.3] group-hover:grayscale-0">
               {opt.icon}
             </div>
          </div>

          {/* Label */}
          <div className="mt-4 text-center">
            <h3 className="text-white text-sm md:text-lg font-serif tracking-[0.2em] font-light opacity-80 group-hover:opacity-100 group-hover:text-amber-100 transition-all duration-300 drop-shadow-sm group-hover:tracking-[0.25em]">
                {opt.title}
            </h3>
          </div>
          
        </button>
      ))}
      <style>{`
        @keyframes float-bubble {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .perspective-500 {
            perspective: 500px;
        }
      `}</style>
    </div>
  );
};

export default ProblemSelection;
