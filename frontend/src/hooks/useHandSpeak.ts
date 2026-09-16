import { useState, useRef, useCallback } from 'react';

interface UseHandSpeakReturn {
  isCameraActive: boolean;
  translatedText: string;
  translationHistory: string[];
  isTranslating: boolean;
  isHandVisible: boolean;
  toggleCamera: () => void;
  handleHandDetected: (letter: string | null) => void;
  clearHistory: () => void;
}

export function useHandSpeak(): UseHandSpeakReturn {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [translationHistory, setTranslationHistory] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isHandVisible, setIsHandVisible] = useState(false);

  const translationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleCamera = useCallback(() => {
    setIsCameraActive((prev) => !prev);
    if (!isCameraActive) {
      // If we are turning it on, it's fine.
      // If we are turning it off, reset states:
      setIsTranslating(false);
      setTranslatedText('');
      setIsHandVisible(false);
    } else {
       setIsTranslating(false);
       setTranslatedText('');
       setIsHandVisible(false);
    }
  }, [isCameraActive]);

  const handleHandDetected = useCallback((letter: string | null) => {
    setIsHandVisible(letter !== null);

    if (letter && isCameraActive) {
      setIsTranslating(true);

      if (!translationTimerRef.current) {
        translationTimerRef.current = setTimeout(() => {
          setTranslatedText(letter);
          setTranslationHistory((prev) => {
            // Append only if it's different from the last one (avoid spam)
            if (prev[prev.length - 1] !== letter) {
              return [...prev, letter];
            }
            return prev;
          });
          setIsTranslating(false);
          translationTimerRef.current = null;
        }, 800); // Confidence buffer
      }
    } else {
      setIsTranslating(false);
      if (translationTimerRef.current) {
        clearTimeout(translationTimerRef.current);
        translationTimerRef.current = null;
      }
    }
  }, [isCameraActive]);

  const clearHistory = useCallback(() => {
    setTranslationHistory([]);
    setTranslatedText('');
  }, []);

  return {
    isCameraActive,
    translatedText,
    translationHistory,
    isTranslating,
    isHandVisible,
    toggleCamera,
    handleHandDetected,
    clearHistory
  };
}
