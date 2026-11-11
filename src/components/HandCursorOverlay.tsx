import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Hand } from 'lucide-react';
import { HandTelemetry } from '../types/vision';

interface HandCursorOverlayProps {
  telemetry: HandTelemetry;
  showHandSkeleton: boolean;
  pinchSensitivity: number;
  handTrackingEnabled: boolean;
  cameraActive: boolean;
}

// MediaPipe 21 Hand Landmark Bone Connections
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [0, 13], [13, 14], [14, 15], [15, 16],// Ring
  [0, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [5, 9], [9, 13], [13, 17],            // Palm knuckles
];

export const HandCursorOverlay: React.FC<HandCursorOverlayProps> = ({
  telemetry,
  showHandSkeleton,
  pinchSensitivity,
  handTrackingEnabled,
  cameraActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [minimizedHud, setMinimizedHud] = useState(false);

  // Draw live 21-landmark skeleton onto the HUD canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!telemetry.detected || telemetry.landmarks.length === 0) {
      // Draw subtle radar grid when waiting for hand in camera FOV
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 28, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    const lm = telemetry.landmarks;
    const w = canvas.width;
    const h = canvas.height;

    // Draw bones
    ctx.strokeStyle = telemetry.isPinching ? '#34D399' : '#38BDF8';
    ctx.lineWidth = 2;
    HAND_CONNECTIONS.forEach(([a, b]) => {
      const p1 = lm[a];
      const p2 = lm[b];
      if (!p1 || !p2) return;
      ctx.beginPath();
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke();
    });

    // Highlight Pinch vector between Thumb Tip (4) and Index Tip (8)
    const thumbTip = lm[4];
    const indexTip = lm[8];
    if (thumbTip && indexTip) {
      ctx.strokeStyle = telemetry.isPinching ? '#10B981' : 'rgba(251, 191, 36, 0.75)';
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(thumbTip.x * w, thumbTip.y * h);
      ctx.lineTo(indexTip.x * w, indexTip.y * h);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw 21 landmark joints
    lm.forEach((pt, idx) => {
      ctx.beginPath();
      const isFingertip = idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20;
      ctx.arc(pt.x * w, pt.y * h, isFingertip ? 3.5 : 2.2, 0, Math.PI * 2);
      ctx.fillStyle =
        (idx === 4 || idx === 8) && telemetry.isPinching
          ? '#34D399'
          : isFingertip
          ? '#FBBF24'
          : '#FFFFFF';
      ctx.fill();
    });
  }, [telemetry]);

  if (!handTrackingEnabled || !cameraActive) return null;

  return (
    <>
      {/* Floating Spatial Gaze/Hand Reticle Cursor */}
      {telemetry.detected && (
        <div
          className="fixed pointer-events-none z-[120]"
          style={{
            left: `${telemetry.cursorX}px`,
            top: `${telemetry.cursorY}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Outer Pulse Ring when pinching */}
          {telemetry.isPinching && (
            <div className="absolute -inset-4 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
          )}

          {/* Main Spatial Cursor Ring */}
          <div
            className={`flex items-center justify-center rounded-full transition-all duration-100 ${
              telemetry.isPinching
                ? 'w-7 h-7 bg-emerald-400/40 border-2 border-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.95)] scale-90'
                : telemetry.gesture === 'open_palm'
                ? 'w-11 h-11 bg-amber-400/30 border-2 border-amber-300 shadow-[0_0_22px_rgba(251,191,36,0.8)]'
                : telemetry.gesture === 'closed_fist'
                ? 'w-9 h-9 bg-rose-500/35 border-2 border-rose-300 shadow-[0_0_22px_rgba(244,63,94,0.8)]'
                : 'w-9 h-9 bg-white/20 border-2 border-white/90 shadow-[0_0_18px_rgba(255,255,255,0.75)]'
            }`}
          >
            <div
              className={`rounded-full ${
                telemetry.isPinching ? 'w-2.5 h-2.5 bg-emerald-200' : 'w-2 h-2 bg-white'
              }`}
            />
          </div>

          {/* Gesture Label Tag next to Reticle */}
          <div className="absolute left-7 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full bg-slate-950/85 border border-white/25 text-[10px] font-semibold tracking-wider uppercase text-white whitespace-nowrap shadow-lg">
            {telemetry.gesture === 'pinch'
              ? 'PINCH ACTIVE'
              : telemetry.gesture === 'open_palm'
              ? 'OPEN PALM'
              : telemetry.gesture === 'closed_fist'
              ? 'CLOSED FIST'
              : telemetry.gesture === 'two_fingers'
              ? 'TWO FINGERS'
              : 'HAND GAZE'}
          </div>
        </div>
      )}

      {/* Corner MediaPipe 21-Point Hand Skeleton Telemetry HUD */}
      {showHandSkeleton && (
        <div className="fixed bottom-20 right-3 z-[88] w-48 sm:w-52 rounded-3xl vision-glass p-2.5 text-white shadow-2xl border border-white/25">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold">
              <Hand size={12} className="text-sky-300" />
              <span>Hand Tracking HUD</span>
            </div>
            <button
              type="button"
              onClick={() => setMinimizedHud((v) => !v)}
              className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80"
              title="Collapse/Expand Hand Skeleton HUD"
            >
              {minimizedHud ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {!minimizedHud && (
            <>
              <div className="relative w-full h-28 rounded-2xl bg-slate-950/55 border border-white/15 overflow-hidden flex items-center justify-center">
                <canvas ref={canvasRef} width={180} height={112} className="w-full h-full" />
                {!telemetry.detected && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
                    <span className="text-[10px] text-white/65 leading-tight">
                      Hold hand in front of camera lens to control spatial cursor
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-2 space-y-1 text-[10px] px-1">
                <div className="flex items-center justify-between text-white/75">
                  <span>Pinch Meter:</span>
                  <span className="font-mono">
                    {telemetry.detected ? telemetry.pinchDistance.toFixed(3) : '—'} / {pinchSensitivity.toFixed(3)}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 ${
                      telemetry.isPinching ? 'bg-emerald-400' : 'bg-sky-400'
                    }`}
                    style={{
                      width: telemetry.detected
                        ? `${Math.min(100, Math.max(8, (1 - telemetry.pinchDistance / 0.22) * 100))}%`
                        : '0%',
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1 pt-1 text-[9px] text-white/65">
                  <div>🤏 Pinch: Select/Move</div>
                  <div>🖐️ Palm: Home UI</div>
                  <div>✊ Fist: Minimize</div>
                  <div>✌️ 2-Finger: Cycle</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
