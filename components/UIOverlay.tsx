
import React, { useEffect, useState, useRef } from 'react';
import { AppState } from '../types';
import { generateSpeech, analyzeUserAppearance, generateResponsiveReply } from '../services/geminiService';
import { audioService } from '../services/audioService';
import ProblemSelection, { ProblemType, ProblemOption } from './ProblemSelection';
import VoiceInput from './VoiceInput';

interface UIOverlayProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
  setIsSpeaking: (speaking: boolean) => void;
  captureRef: React.MutableRefObject<(() => string | null) | undefined>;
  onAppearanceAnalyzed: (data: any) => void;
}

const DIALOGUES = [
  "你掉进来了……这里是云端的裂缝。",
  "在这里，所有的复杂都会化作光点。如果你找不到方向，心火就会逐渐熄灭。",
  "想要离开，你必须点亮那个代表你‘理想自我’的先祖。请回忆你现在的样子。我会把你的光影和声音刻在云里，作为路标。"
];

const PHASE_2_DIALOGUE = "看，这就是被裂缝剥离后的你。虽然有些模糊，但那是你灵魂最初的形状。";
const PHASE_3_DIALOGUE = "试着触碰它。它正在感受你的心火。";
const PHASE_4_DIALOGUE = "现在的光芒还太微弱，无法飞跃这片云海。只有找到心中最沉重的牵挂，愿望的力量才能带你离开。准备好了吗？";

const HEAVY_QUESTION_INTRO = "在云端，所有的重量都会变成坠落的理由。告诉我，此刻让你飞不起来的是什么？";
const CONCLUSION_DIALOGUE = "记住这光芒的样子。即使在黑暗中，你的声音也能点亮前路。带着这份温暖，起飞吧。";

const PROBLEM_SCRIPTS: Record<ProblemType, { response: string; question: string, title: string }> = {
  fog: {
    title: "迷雾",
    response: "这里的雾气确实很重，但似乎你心里的雾比这更厚。",
    question: "你是因为眼前的选择太多而看不清路，还是觉得根本没有路可以选？试着描述一下这种‘看不见’的感觉。"
  },
  mask: {
    title: "面具",
    response: "戴着厚重的壳在云中行走，是很消耗心火的。",
    question: "在谁的面前，你觉得表演得最辛苦？如果现在可以彻底摘下它，你第一句想说的话会是什么？"
  },
  hourglass: {
    title: "漏斗",
    response: "云流在这里是静止的，但我听到了你心里时钟疯狂走动的声音。",
    question: "你是因为害怕落后于别人而焦虑，还是因为没能完成对自己许下的某个承诺？那个让你一直放不下的‘截止日期’是什么？"
  },
  tangle: {
    title: "乱麻",
    response: "你的频率很乱。太多的丝线缠绕在一起，让你无法呼吸了。",
    question: "如果这团乱麻里有一根‘主线’，你觉得它是关于‘不自信’，还是关于‘对未知的恐惧’？试着抓出那根线告诉我。"
  },
  custom: {
    title: "未知心事",
    response: "有些重量无法被归类，它们只能通过诉说来释放。",
    question: "我在听。请告诉我，此刻压在你心头的是什么？"
  }
};

const LOADING_STEPS = [
    "正在点亮心火...",
    "收集星光...",
    "重构灵魂形状...",
    "唤醒先祖记忆..."
];

const UIOverlay: React.FC<UIOverlayProps> = ({ 
    appState, 
    setAppState, 
    setIsSpeaking, 
    captureRef,
    onAppearanceAnalyzed
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [dialogueIndex, setDialogueIndex] = useState(0);
  
  // New state for click-to-continue logic
  const [isWaitingForClick, setIsWaitingForClick] = useState(false);
  const resolveClickWait = useRef<(() => void) | null>(null);
  
  // Loading state for analysis visual
  const [loadingText, setLoadingText] = useState(LOADING_STEPS[0]);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Phase 2 Interactions
  const [selectedProblem, setSelectedProblem] = useState<ProblemType | null>(null);
  const [hoveredProblem, setHoveredProblem] = useState<ProblemOption | null>(null); // For dynamic title
  const [isRecording, setIsRecording] = useState(false);
  
  const audioCache = useRef<Map<string, string>>(new Map());
  const currentRequestId = useRef(0);
  const isMounted = useRef(true);

  useEffect(() => {
      isMounted.current = true;
      return () => { isMounted.current = false; };
  }, []);

  // --- Speech Helper ---
  const speakText = async (text: string, waitForUser: boolean = false): Promise<void> => {
      if (!isMounted.current) return;
      setCurrentText(text);
      setShowDialog(true);
      
      const requestId = ++currentRequestId.current;
      audioService.stopSpeech(); 
      setIsSpeaking(true);
      
      try {
          let base64Audio = audioCache.current.get(text);
          if (!base64Audio) {
            base64Audio = await generateSpeech(text);
            if (isMounted.current && base64Audio) audioCache.current.set(text, base64Audio);
          }

          if (isMounted.current && requestId === currentRequestId.current) {
              if (base64Audio) {
                  await audioService.playSpeech(base64Audio);
              } else {
                  // Fallback
                  const readingTime = Math.max(2000, text.length * 200);
                  await new Promise(resolve => setTimeout(resolve, readingTime));
              }
          }
      } catch (e) {
          console.error("Speech flow error", e);
          if (isMounted.current && requestId === currentRequestId.current) {
             await new Promise(resolve => setTimeout(resolve, 2000));
          }
      } finally {
          if (isMounted.current && requestId === currentRequestId.current) {
              setIsSpeaking(false);
          }
      }

      // If requested, wait for user click before resolving
      if (waitForUser && isMounted.current && requestId === currentRequestId.current) {
          setIsWaitingForClick(true);
          await new Promise<void>(resolve => {
              resolveClickWait.current = resolve;
          });
          if (isMounted.current) setIsWaitingForClick(false);
      }
  };

  // --- Initial Dialogues Flow ---
  useEffect(() => {
    if (appState === AppState.AWAKENED) {
      const timer = setTimeout(() => {
        speakText(DIALOGUES[0]);
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [appState]);

  useEffect(() => {
      if (appState === AppState.AWAKENED && dialogueIndex > 0 && dialogueIndex < DIALOGUES.length) {
          speakText(DIALOGUES[dialogueIndex]);
      }
  }, [dialogueIndex, appState]);


  // --- Analyze Logic ---
  useEffect(() => {
      if (appState === AppState.RECORDING) {
          // Robust Camera Ready Check
          let checks = 0;
          const checkCameraReady = setInterval(() => {
             // Try to capture a frame. If it returns string, camera is ready.
             const testFrame = captureRef.current ? captureRef.current() : null;
             
             if (testFrame || checks > 20) { // Wait max 4 seconds (20 * 200ms)
                 clearInterval(checkCameraReady);
                 startCountdownFlow();
             }
             checks++;
          }, 200);

          const startCountdownFlow = () => {
             if(!isMounted.current) return;
             setCountdown(3);
             
             const countdownInterval = setInterval(() => {
                if(!isMounted.current) { clearInterval(countdownInterval); return; }
                setCountdown(prev => {
                    if (prev === null || prev <= 1) return null;
                    return prev - 1;
                });
             }, 1000);

             // Capture happens exactly when countdown ends (3s)
             const captureTimer = setTimeout(async () => {
                 clearInterval(countdownInterval);
                 setCountdown(null);
                 
                 if (captureRef.current && isMounted.current) {
                     const image = captureRef.current();
                     if (image) {
                         setAppState(AppState.ANALYZING);
                         
                         let step = 0;
                         const loadingInterval = setInterval(() => {
                             if (!isMounted.current) return;
                             step = (step + 1) % LOADING_STEPS.length;
                             setLoadingText(LOADING_STEPS[step]);
                         }, 1200);

                         try {
                             const appearance = await analyzeUserAppearance(image);
                             if (!isMounted.current) {
                                 clearInterval(loadingInterval);
                                 return;
                             }
                             clearInterval(loadingInterval); 
                             onAppearanceAnalyzed(appearance);
                             setAppState(AppState.MIRRORING);
                             
                             await speakText(PHASE_2_DIALOGUE, true);
                             if (!isMounted.current) return;
                             await speakText(PHASE_3_DIALOGUE, true);
                             if (!isMounted.current) return;
                             await speakText(PHASE_4_DIALOGUE, true);
                             if (!isMounted.current) return;

                             setAppState(AppState.TRANSFORMED);
                         } catch (err) {
                             console.error("Flow error:", err);
                             clearInterval(loadingInterval);
                             // Recover state if analysis fails
                             setAppState(AppState.MIRRORING);
                         }
                     } else {
                         console.warn("Failed to capture image");
                         // Simple retry or reset
                         setAppState(AppState.RECORDING);
                     }
                 }
             }, 3500); // 3.5s to cover the "1"

             return () => {
                 clearInterval(countdownInterval);
                 clearTimeout(captureTimer);
             };
          };

          return () => {
              clearInterval(checkCameraReady);
          };
      }
  }, [appState, setAppState, captureRef, onAppearanceAnalyzed]);

  // --- Transition to Problem Selection ---
  useEffect(() => {
      if (appState === AppState.TRANSFORMED) {
          const runSequence = async () => {
              await speakText(HEAVY_QUESTION_INTRO, true); 
              if(isMounted.current) setAppState(AppState.CHOOSING_PROBLEM);
          };
          runSequence();
      }
  }, [appState, setAppState]);

  // --- Handle Problem Selection ---
  const handleProblemSelect = async (id: ProblemType) => {
      setSelectedProblem(id);
      setAppState(AppState.NPC_ASKING_DETAIL);
      setShowDialog(true);
      
      const script = PROBLEM_SCRIPTS[id];
      await speakText(script.response, true);
      await speakText(script.question, true); 
      
      if (isMounted.current) {
          setShowDialog(false); 
          setAppState(AppState.LISTENING_TO_USER);
      }
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
      console.log("Recorded audio blob size:", audioBlob.size);
      
      setAppState(AppState.PROCESSING_REPLY);
      
      // AI Processing for response based on user input for ALL problem types
      let replyText = "我听到了。你的声音已经留在了裂缝里。";
      
      // Show loading text
      setCurrentText("正在解析灵魂频率..."); 
      setShowDialog(true);

      const context = selectedProblem ? PROBLEM_SCRIPTS[selectedProblem].title : "未知";

      try {
          replyText = await generateResponsiveReply(audioBlob, context);
      } catch (e) {
          console.error("AI Reply failed", e);
      }
      
      // Transition to REFINING state to show avatar change
      if (isMounted.current) {
         setAppState(AppState.REFINING);
      }

      // Play the AI generated response
      await speakText(replyText, true); 

      // Transition to final state
      if (isMounted.current) {
          setAppState(AppState.CONCLUSION);
          await speakText(CONCLUSION_DIALOGUE, false); 
      }
  };

  const isIntro = appState === AppState.AWAKENED;
  const isLastIntroDialogue = dialogueIndex === DIALOGUES.length - 1;

  const handleUserClick = () => {
      if (isIntro && !isLastIntroDialogue) {
          setDialogueIndex(prev => prev + 1);
      } else if (isWaitingForClick) {
          if (resolveClickWait.current) {
              resolveClickWait.current();
              resolveClickWait.current = null;
          }
          setIsWaitingForClick(false);
      }
  };

  const handleRecordCurrentStatus = async (e: React.MouseEvent) => {
      e.stopPropagation(); 
      try {
          // Explicitly request permissions before state change
          await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setAppState(AppState.RECORDING);
          setShowDialog(false); 
      } catch (err) {
          console.error("Permission denied", err);
          alert("需要权限才能继续 / Camera access required");
      }
  };

  // --- Render Logic ---

  if (appState === AppState.FOGGY) {
    return (
      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none select-none">
        <div className="text-center animate-fade-in">
          {/* Changed shadow from white to dark/gold for contrast on bright background */}
          <h1 className="text-5xl md:text-8xl font-bold tracking-[0.1em] mb-4 text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]" style={{ fontFamily: '"Cinzel", serif' }}>
            SKY: REBORN
          </h1>
          <p className="text-lg md:text-xl tracking-[0.5em] font-light text-white opacity-90 ml-3 drop-shadow-md">
            重 塑 自 我
          </p>
        </div>
        <div className="absolute bottom-20 text-white text-[10px] md:text-xs tracking-[0.3em] uppercase opacity-0 animate-fade-in-delayed drop-shadow-sm">
           Wipe Screen To Fly
        </div>
      </div>
    );
  }

  if (appState === AppState.RECORDING && countdown !== null) {
      return (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-white/10 backdrop-blur-sm transition-all duration-300">
              <div key={countdown} className="text-9xl text-amber-100 font-serif animate-ping-once drop-shadow-[0_0_10px_rgba(0,0,0,0.2)]">
                  {countdown}
              </div>
          </div>
      );
  }

  if (appState === AppState.ANALYZING) {
      return (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none">
              <div className="mt-40 h-8">
                 <p className="text-amber-50 text-sm tracking-[0.5em] font-light animate-fade-in-up uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                    {loadingText}
                 </p>
              </div>
          </div>
      );
  }

  // --- Problem Selection Screen ---
  if (appState === AppState.CHOOSING_PROBLEM) {
      return (
          <div className="absolute inset-0 z-40 flex flex-col items-center pt-24 md:pt-32 pointer-events-none">
              <div className="text-center h-[140px] flex flex-col justify-center transition-all duration-500 ease-out mb-2 px-6 pointer-events-auto">
                  {hoveredProblem ? (
                      <div className="animate-fade-in-up key={hoveredProblem.id}">
                         <h3 className="text-2xl md:text-3xl text-amber-100 font-serif tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] mb-3">
                            {hoveredProblem.title}
                         </h3>
                         <p className="text-white text-sm md:text-base font-light tracking-wider max-w-xl mx-auto leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                            “{hoveredProblem.description}”
                         </p>
                      </div>
                  ) : (
                      <div className="animate-fade-in-up">
                        <p className="text-white tracking-[0.3em] text-xs md:text-sm font-light mb-2 drop-shadow-sm">此刻你心中</p>
                        <h2 className="text-4xl md:text-5xl text-white font-serif tracking-widest drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
                            最沉重的事
                        </h2>
                      </div>
                  )}
              </div>
              <div className="w-full flex justify-center pointer-events-auto pb-10">
                 <ProblemSelection 
                    onSelect={handleProblemSelect} 
                    onHover={setHoveredProblem}
                 />
              </div>
          </div>
      );
  }

  // --- Conclusion Screen ---
  if (appState === AppState.CONCLUSION) {
    return (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-auto">
             <div className="text-center animate-fade-in mb-10 px-4">
                 <h2 className="text-3xl md:text-5xl text-white font-serif tracking-widest mb-6 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
                    灵魂重塑完成
                 </h2>
                 <p className="text-white tracking-widest text-sm max-w-md mx-auto leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                    你的频率已更新。
                 </p>
             </div>
             
             {/* Sky Style Button: Diamond/Rhombus shape hint via rotation or soft rounding */}
             <button 
                onClick={() => window.location.reload()}
                className="group relative px-10 py-4 overflow-hidden transition-all duration-500 hover:scale-105"
             >
                {/* Background Shape */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-2xl rotate-0 group-hover:rotate-180 transition-transform duration-700 border border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.2)]"></div>
                <span className="relative z-10 text-white font-serif text-xs tracking-[0.3em] group-hover:tracking-[0.5em] transition-all drop-shadow-md">再 次 进 入</span>
             </button>
        </div>
    );
  }

  // --- Standard/Listening Interaction Layer ---
  
  const canAdvance = (isIntro && !isLastIntroDialogue) || isWaitingForClick;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      
      {/* Global Click Handler Layer for Advancing Dialogues */}
      {canAdvance && (
          <div className="absolute inset-0 w-full h-full pointer-events-auto cursor-pointer" onClick={handleUserClick} />
      )}

      {/* Voice Input Layer (Integrated seamlessly at the bottom) */}
      {appState === AppState.LISTENING_TO_USER && (
          <div className="absolute bottom-16 left-0 w-full flex justify-center z-50 pointer-events-auto">
              <VoiceInput 
                  onRecordingComplete={handleRecordingComplete} 
                  isRecording={isRecording}
                  setIsRecording={setIsRecording}
              />
          </div>
      )}

      {showDialog && (
        <div className={`absolute left-1/2 transform -translate-x-1/2 w-full max-w-2xl text-center px-4 flex flex-col items-center transition-all duration-1000 ${appState === AppState.LISTENING_TO_USER ? 'top-[20%]' : 'bottom-[20%]'}`}>
          
          <div className="animate-fade-in-up min-h-[120px] pointer-events-auto relative z-10 flex flex-col items-center">
            
            {/* Loading Spinner for Processing */}
            {appState === AppState.PROCESSING_REPLY && (
               <div className="mb-4">
                  {/* Sky Style Spinner: Rotating Diamond */}
                  <div className="w-6 h-6 border-2 border-white/80 rotate-45 animate-spin"></div>
               </div>
            )}

            <p className="text-white text-lg md:text-2xl font-normal tracking-widest drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)] leading-relaxed select-none mb-6 text-center" 
               style={{ fontFamily: '"Cinzel", serif' }}>
              “{currentText}”
            </p>
            
            {/* Blinking Prompt - Diamond Icon */}
            {canAdvance && (
                 <div className="mt-4 flex flex-col items-center animate-bounce text-white drop-shadow-md">
                     <div className="w-2 h-2 bg-white rotate-45 mb-2 shadow-sm"></div>
                     <span className="text-[10px] tracking-[0.2em]">点击继续</span>
                 </div>
            )}

            {isIntro && isLastIntroDialogue && (
               <div className="mt-8 flex justify-center">
                   {/* Main Action Button - Diamond Shape inspired */}
                   <button 
                      onClick={handleRecordCurrentStatus}
                      className="group relative w-32 h-32 flex items-center justify-center transition-all duration-700 hover:scale-110">
                      
                      {/* Rotating Diamond Backgrounds */}
                      <div className="absolute w-24 h-24 bg-white/10 backdrop-blur-sm rotate-45 border border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.2)] group-hover:bg-white/20 transition-all"></div>
                      <div className="absolute w-20 h-20 border border-white/20 rotate-45 scale-75 group-hover:scale-100 transition-all duration-1000"></div>

                      <span className="relative z-10 text-xs tracking-[0.2em] font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] group-hover:opacity-100 opacity-90">[ 记录现状 ]</span>
                   </button>
               </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .animate-fade-in-delayed {
            animation: fadeIn 2s ease-out 1s forwards;
        }
        @keyframes ping-once {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 0; }
        }
        .animate-ping-once {
            animation: ping-once 0.9s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default UIOverlay;
