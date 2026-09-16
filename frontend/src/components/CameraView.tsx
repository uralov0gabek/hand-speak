import { useRef, useEffect } from 'react';
import { VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as tf from '@tensorflow/tfjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Hands = (window as any).Hands;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HAND_CONNECTIONS = (window as any).HAND_CONNECTIONS;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const drawConnectors = (window as any).drawConnectors;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const drawLandmarks = (window as any).drawLandmarks;

const CLASSES = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','del','nothing','space'];

const CONFIRM_FRAMES = 5;
const MIN_CONFIDENCE = 0.80;

interface CameraViewProps {
  isActive: boolean;
  onHandDetected?: (letter: string | null) => void;
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeLandmarks(landmarks: any[]): number[] {
  const wrist = landmarks[0];
  let maxDist = 0;
  for (let i = 1; i < 21; i++) {
    const d = Math.sqrt(
      Math.pow(landmarks[i].x - wrist.x, 2) +
      Math.pow(landmarks[i].y - wrist.y, 2) +
      Math.pow(landmarks[i].z - wrist.z, 2)
    );
    if (d > maxDist) maxDist = d;
  }
  if (maxDist < 1e-6) maxDist = 1;
  const arr: number[] = [];
  for (let i = 0; i < 21; i++) {
    arr.push((landmarks[i].x - wrist.x) / maxDist);
    arr.push((landmarks[i].y - wrist.y) / maxDist);
    arr.push((landmarks[i].z - wrist.z) / maxDist);
  }
  return arr;
}

export function CameraView({ isActive, onHandDetected, className }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const aiModelRef = useRef<tf.GraphModel | null>(null);
  const isInferringRef = useRef(false);

  const candidateRef = useRef<string | null>(null);
  const candidateCountRef = useRef(0);
  const lastReportedRef = useRef<string | null>(null);

  useEffect(() => {
    async function loadModel() {
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        const model = await tf.loadGraphModel('/tfjs_model/model.json');
        aiModelRef.current = model;
        const dummy = tf.zeros([1, 63]);
        (model.predict(dummy) as tf.Tensor).dispose();
        dummy.dispose();
        console.log('✅ Model Loaded');
      } catch (err) {
        console.warn('⚠️ Model not found.', err);
      }
    }
    loadModel();
  }, []);

  useEffect(() => {
    if (!isActive || !videoRef.current || !canvasRef.current) return;

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext('2d')!;
    let animationFrameId: number;

    candidateRef.current = null;
    candidateCountRef.current = 0;
    lastReportedRef.current = null;

    const hands = new Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.6,
    });

    function confirmLetter(rawLetter: string | null) {
      const letter = (rawLetter === 'nothing' || rawLetter === 'space') ? null : rawLetter;

      if (letter === candidateRef.current) {
        candidateCountRef.current += 1;
      } else {
        candidateRef.current = letter;
        candidateCountRef.current = 1;
      }

      if (candidateCountRef.current >= CONFIRM_FRAMES) {
        if (letter !== lastReportedRef.current) {
          lastReportedRef.current = letter;
          onHandDetected?.(letter);
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hands.onResults((results: any) => {
      if (!canvasCtx) return;
      canvasCtx.save();

      if (canvasElement.width !== videoElement.videoWidth && videoElement.videoWidth > 0) {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
      }
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // Draw connections with neon colors
        for (const hand of results.multiHandLandmarks) {
          drawConnectors(canvasCtx, hand, HAND_CONNECTIONS, { color: 'rgba(34, 197, 94, 0.8)', lineWidth: 3 });
          drawLandmarks(canvasCtx, hand, { color: 'rgba(255, 255, 255, 0.9)', lineWidth: 1, radius: 4 });
        }

        if (!isInferringRef.current) {
          isInferringRef.current = true;
          setTimeout(() => {
            try {
              if (aiModelRef.current) {
                const normalized = normalizeLandmarks(landmarks);
                tf.tidy(() => {
                  const input = tf.tensor2d([normalized]);
                  const pred = (aiModelRef.current as tf.GraphModel).predict(input) as tf.Tensor;
                  const scores = Array.from(pred.dataSync());
                  const maxScore = Math.max(...scores);
                  const maxIndex = scores.indexOf(maxScore);
                  let detectedLetter: string | null = CLASSES[maxIndex];

                  if (maxScore >= MIN_CONFIDENCE) {
                    // --- Heuristic Filters ---
                    // Fix false positive: Open hand (fingers spread) being detected as 'B'
                    if (detectedLetter === 'B') {
                      const getDist = (p1: {x: number, y: number}, p2: {x: number, y: number}) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
                      const spreadDist = getDist(landmarks[8], landmarks[20]); // index tip to pinky tip
                      const palmSize = getDist(landmarks[0], landmarks[9]); // wrist to middle mcp
                      const wristToMidTip = getDist(landmarks[0], landmarks[12]); // wrist to middle tip
                      
                      // 1. Fingers must be touching (spreadDist is very small, < 0.5 of palm size)
                      // 2. Fingers must be straight up (not relaxed/curled) -> wristToMidTip > palmSize * 1.6
                      if (spreadDist > palmSize * 0.5 || wristToMidTip < palmSize * 1.6) {
                        detectedLetter = null;
                      }
                    }

                    if (detectedLetter) {
                      confirmLetter(detectedLetter);
                    } else {
                      confirmLetter(null);
                    }
                  } else {
                    confirmLetter(null);
                  }
                });
              } else {
                confirmLetter(null);
              }
            } catch {
              confirmLetter(null);
            } finally {
              isInferringRef.current = false;
            }
          }, 0);
        }
      } else {
        candidateRef.current = null;
        candidateCountRef.current = 0;
        if (lastReportedRef.current !== null) {
          lastReportedRef.current = null;
          onHandDetected?.(null);
        }
      }

      canvasCtx.restore();
    });

    const sendFrame = async () => {
      if (!videoElement.paused && !videoElement.ended && hands) {
        await hands.send({ image: videoElement });
      }
      if (isActive) {
        animationFrameId = requestAnimationFrame(sendFrame);
      }
    };

    navigator.mediaDevices
      .getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } })
      .then((stream) => {
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          sendFrame();
        };
      })
      .catch((err) => console.error('Camera Error:', err));

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      const stream = videoElement.srcObject as MediaStream;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      hands.close();
    };
  }, [isActive, onHandDetected]);

  return (
    <div className={cn(
      'relative overflow-hidden flex items-center justify-center transition-all duration-500',
      className
    )}>
      {isActive ? (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 filter brightness-110 contrast-110"
            playsInline
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]"
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center text-zinc-600 gap-4 absolute inset-0 bg-black/40 backdrop-blur-md z-10">
          <div className="w-16 h-16 rounded-full glassmorphism flex items-center justify-center border border-white/5">
            <VideoOff size={28} strokeWidth={1.5} className="text-zinc-500" />
          </div>
          <p className="text-sm font-medium tracking-wide uppercase text-zinc-500">Camera is offline</p>
        </div>
      )}
    </div>
  );
}
