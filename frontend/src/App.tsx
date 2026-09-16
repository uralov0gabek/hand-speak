import { useState } from 'react';
import { CameraView } from './components/CameraView';
import { TranslationBox } from './components/TranslationBox';
import { Settings, HelpCircle, Activity, X, Info } from 'lucide-react';
import { useHandSpeak } from './hooks/useHandSpeak';

export default function App() {
  const {
    isCameraActive,
    translatedText,
    translationHistory,
    isTranslating,
    isHandVisible,
    toggleCamera,
    handleHandDetected
  } = useHandSpeak();

  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden font-sans antialiased text-zinc-100">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

      {/* Header Navigation */}
      <header className="w-full z-10 glassmorphism sticky top-0 md:relative md:bg-transparent md:border-none md:backdrop-blur-none px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative transition-all duration-500 ${isHandVisible ? 'bg-primary/20 border-primary/50 pulse-glow' : 'glassmorphism'}`}>
            <Activity size={18} className={isHandVisible ? 'text-primary' : 'text-zinc-400'} />
            {isHandVisible && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse border-2 border-background" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-wide text-zinc-100 leading-tight">HandSpeak</span>
            <span className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">Live Translation</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsGuideOpen(true)}
            className="w-10 h-10 rounded-full glassmorphism flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-white/10 transition-all hover-lift"
            aria-label="Guide"
          >
            <HelpCircle size={20} strokeWidth={1.5} />
          </button>
          <button 
            className="w-10 h-10 rounded-full glassmorphism flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-white/10 transition-all hover-lift"
            aria-label="Settings"
          >
            <Settings size={20} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col items-center gap-6 z-10">
        
        {/* Title & Status */}
        <div className="flex flex-col items-center text-center gap-3 w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-gradient pb-1">
            Sign to Text, Instantly.
          </h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-md leading-relaxed">
            {isCameraActive 
              ? (isHandVisible ? (
                  <span className="text-primary font-medium flex items-center justify-center gap-2">
                    <Activity size={14} className="animate-pulse" /> Hand Detected. Translating...
                  </span>
                ) : "Position your hand clearly in the center of the frame.")
              : "Experience real-time sign language translation."
            }
          </p>
        </div>

        {/* Core Layout: Camera + Translation Box */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch animate-in fade-in zoom-in-95 duration-700 delay-150">
          
          {/* Camera Section (Left on Desktop, Top on Mobile) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
             <div className="w-full flex justify-between items-center px-1">
               <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-widest">
                  <span className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-primary animate-pulse' : 'bg-red-500'}`} />
                  {isCameraActive ? 'Live Camera Feed' : 'Camera Offline'}
               </div>
               
               <button 
                  onClick={toggleCamera}
                  className={`relative px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 flex items-center gap-2 hover-lift ${
                    isCameraActive 
                      ? "glassmorphism text-zinc-300 hover:text-white" 
                      : "bg-zinc-100 text-zinc-900 hover:bg-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  }`}
                >
                  {isCameraActive ? 'Stop Camera' : 'Start Camera'}
                </button>
             </div>
             
             {/* Camera View Wrapper */}
             <div className="w-full aspect-[4/3] md:aspect-video rounded-[2rem] overflow-hidden glass-panel relative p-1 group">
               <CameraView 
                 isActive={isCameraActive} 
                 onHandDetected={handleHandDetected}
                 className="w-full h-full rounded-[1.75rem]" 
               />
               
               {/* Overlay scanning effect */}
               {isCameraActive && isHandVisible && (
                 <div className="absolute inset-0 pointer-events-none rounded-[1.75rem] border-2 border-primary/30 shadow-[inset_0_0_50px_rgba(34,197,94,0.1)]" />
               )}
             </div>
          </div>

          {/* Translation Result Section (Right on Desktop, Bottom on Mobile) */}
          <div className="lg:col-span-4 flex flex-col w-full h-full">
            <TranslationBox 
              text={translatedText} 
              history={translationHistory}
              isTranslating={isTranslating} 
              className="h-full min-h-[300px]"
            />
          </div>

        </div>
      </main>

      {/* Guide Modal */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative glass-panel rounded-3xl overflow-hidden max-w-2xl w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200 border border-white/10">
            
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5 backdrop-blur-md z-10 sticky top-0">
              <div className="flex items-center gap-2">
                <Info size={18} className="text-accent" />
                <h2 className="text-lg font-semibold text-white tracking-tight">Sign Language Dictionary</h2>
              </div>
              <button 
                onClick={() => setIsGuideOpen(false)}
                className="w-8 h-8 rounded-full glassmorphism flex items-center justify-center text-zinc-400 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-black/20">
              <img 
                src="/alphabet3.png" 
                alt="Sign Language Alphabet" 
                className="w-full h-auto rounded-xl shadow-2xl border border-white/5"
              />
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
