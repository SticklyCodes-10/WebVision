import React from 'react';
import { Camera, Glasses, Hand, MonitorSmartphone, Sparkles } from 'lucide-react';

interface EntryPortalModalProps {
  isOpen: boolean;
  onEnterSpatialMode: () => void;
  onEnterVRMode: () => void;
  onContinueTouchMode: () => void;
}

export const EntryPortalModal: React.FC<EntryPortalModalProps> = ({
  isOpen,
  onEnterSpatialMode,
  onEnterVRMode,
  onContinueTouchMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl">
      <div className="relative max-w-lg w-full rounded-[38px] vision-glass-active p-6 sm:p-8 text-white shadow-[0_40px_110px_rgba(0,0,0,0.85)] border border-white/35">
        {/* Top Ambient Badge */}
        <div className="flex items-center justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-semibold tracking-wide text-white/95">
            <Sparkles size={13} className="text-sky-300" />
            <span>visionOS 2.0 · Spatial Web Computing</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-center text-white mb-2">
          Welcome to Apple Vision Web
        </h1>
        <p className="text-xs sm:text-sm text-white/75 text-center leading-relaxed mb-6">
          Experience floating translucent glass windows layered over your live physical surroundings with real-time MediaPipe hand gesture tracking.
        </p>

        {/* Primary Action: Enter Spatial Mode (Rear Camera + MediaPipe Hand Tracking) */}
        <div className="space-y-2.5 mb-6">
          <button
            type="button"
            onClick={onEnterSpatialMode}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm sm:text-base shadow-[0_12px_32px_rgba(14,165,233,0.45)] border border-white/35 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
          >
            <Camera size={18} />
            <span>Enter Spatial Mode (Rear Camera + Hands)</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onEnterVRMode}
              className="py-2.5 px-4 rounded-2xl bg-white/14 hover:bg-white/24 border border-white/25 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Glasses size={16} className="text-violet-300" />
              <span>Enter VR Mode</span>
            </button>

            <button
              type="button"
              onClick={onContinueTouchMode}
              className="py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/18 text-white/90 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <MonitorSmartphone size={16} className="text-emerald-300" />
              <span>Environment + Touch Mode</span>
            </button>
          </div>
        </div>

        {/* Real-Time MediaPipe Hand Gestures Guide */}
        <div className="rounded-3xl bg-black/28 border border-white/15 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/90 mb-3">
            <Hand size={14} className="text-sky-300" />
            <span>Real-Time MediaPipe Hand Gestures Supported</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-2.5">
              <div className="font-semibold text-emerald-300 mb-0.5">🤏 Pinch</div>
              <div className="text-[11px] text-white/70 leading-snug">
                Thumb + Index pinch to select apps, click UI, or grab & move windows.
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-2.5">
              <div className="font-semibold text-amber-300 mb-0.5">🖐️ Open Palm</div>
              <div className="text-[11px] text-white/70 leading-snug">
                Hold 5 fingers open to summon Home View & restore minimized windows.
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-2.5">
              <div className="font-semibold text-rose-300 mb-0.5">✊ Closed Fist</div>
              <div className="text-[11px] text-white/70 leading-snug">
                Close fist briefly to minimize or close the currently active window.
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-2.5">
              <div className="font-semibold text-violet-300 mb-0.5">✌️ Two Fingers</div>
              <div className="text-[11px] text-white/70 leading-snug">
                Extend Index + Middle fingers to cycle focus between open windows.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
