import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, History, Sparkles } from 'lucide-react';

interface TranslationBoxProps {
  text: string;
  history: string[];
  isTranslating: boolean;
  className?: string;
}

export function TranslationBox({ text, history, isTranslating, className }: TranslationBoxProps) {
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest history item
  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  return (
    <div className={cn(
      "relative glass-panel rounded-[2rem] overflow-hidden flex flex-col h-full transition-all duration-300",
      className
    )}>
      
      {/* Current Translation (Main Box) - Upper Section */}
      <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center relative border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        
        {/* Glow behind text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[150px] h-[150px] bg-primary/20 rounded-full blur-[80px]" />
        </div>

        {text ? (
          <div className="flex flex-col items-center gap-4 z-10">
            <span className="text-6xl md:text-8xl font-bold tracking-tight text-white animate-in fade-in zoom-in-90 duration-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              {text}
            </span>
            
            <div className={`flex items-center gap-2 text-xs font-medium tracking-widest uppercase px-4 py-1.5 rounded-full glassmorphism transition-opacity duration-300 ${isTranslating ? 'opacity-100' : 'opacity-0'}`}>
              <Loader2 size={14} className="animate-spin text-primary" />
              <span className="text-zinc-300">Processing</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 text-zinc-600 z-10">
          </div>
        )}
      </div>

      {/* History Panel (Side Box) - Lower Section */}
      <div className="h-[40%] min-h-[150px] bg-black/40 flex flex-col border-t border-white/5 relative">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
          <History size={14} className="text-accent" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Translation History</span>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto flex flex-wrap content-start gap-2 custom-scrollbar">
          {history.length > 0 ? (
            history.map((item, index) => (
              <span 
                key={index} 
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-200 text-sm font-medium rounded-xl border border-white/10 transition-all hover-lift animate-in slide-in-from-bottom-2 fade-in shadow-sm backdrop-blur-md"
              >
                {item}
              </span>
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-xs text-zinc-600 font-medium">History is empty</p>
            </div>
          )}
          <div ref={historyEndRef} className="w-full h-4" />
        </div>
      </div>

    </div>
  );
}
