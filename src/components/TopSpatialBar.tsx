import React, { useEffect, useState } from 'react';
import {
  Camera,
  CameraOff,
  Glasses,
  Hand,
  LayoutGrid,
  Mountain,
  RefreshCw,
  Sliders,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { SPATIAL_ENVIRONMENTS } from '../data/initialData';
import { EnvironmentId, HandTelemetry, VisionOSSettings } from '../types/vision';

interface TopSpatialBarProps {
  settings: VisionOSSettings;
  cameraStatus: 'idle' | 'requesting' | 'active' | 'denied' | 'error';
  modelStatus: 'idle' | 'loading' | 'ready' | 'error';
  telemetry: HandTelemetry;
  showHomeGrid: boolean;
  onToggleHomeGrid: () => void;
  onUpdateSettings: (partial: Partial<VisionOSSettings>) => void;
  onEnterSpatialMode: () => void;
  onToggleVRMode: () => void;
  onOpenSettingsApp: () => void;
}

const GESTURE_LABELS: Record<string, { label: string; color: string }> = {
  none: { label: 'Scanning Hand', color: 'text-white/70 bg-white/10' },
  pointing: { label: 'Tracking Gaze/Hand', color: 'text-sky-300 bg-sky-500/20 border-sky-400/40' },
  pinch: { label: 'PINCH · Select / Drag', color: 'text-emerald-300 bg-emerald-500/30 border-emerald-400/60' },
  open_palm: { label: 'OPEN PALM · Home UI', color: 'text-amber-200 bg-amber-500/30 border-amber-400/60' },
  closed_fist: { label: 'CLOSED FIST · Minimize', color: 'text-rose-200 bg-rose-500/30 border-rose-400/60' },
  two_fingers: { label: '2 FINGERS · Cycle Window', color: 'text-violet-200 bg-violet-500/30 border-violet-400/60' },
};

export const TopSpatialBar: React.FC<TopSpatialBarProps> = ({
  settings,
  cameraStatus,
  modelStatus,
  telemetry,
  showHomeGrid,
  onToggleHomeGrid,
  onUpdateSettings,
  onEnterSpatialMode,
  onToggleVRMode,
  onOpenSettingsApp,
}) => {
  const [timeStr, setTimeStr] = useState<string>('9:41');
  const [showImmersionPopover, setShowImmersionPopover] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateClock();
    const id = setInterval(updateClock, 15000);
    return () => clearInterval(id);
  }, []);

  const currentEnv =
    SPATIAL_ENVIRONMENTS.find((e) => e.id === settings.environmentId) || SPATIAL_ENVIRONMENTS[1];
  const gestureInfo = GESTURE_LABELS[telemetry.gesture] || GESTURE_LABELS.none;

  return (
    <header className="fixed top-2.5 inset-x-2.5 z-[90] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
      {/* Left Pill: Digital Crown Home View + Environment Immersion Dial */}
      <div className="pointer-events-auto flex items-center gap-1.5 vision-pill rounded-full px-2.5 py-1.5">
        <button
          type="button"
          onClick={onToggleHomeGrid}
          title="Summon Home View (or show Open Palm)"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
            showHomeGrid
              ? 'bg-white text-slate-950 shadow-md'
              : 'bg-white/10 hover:bg-white/20 text-white/90'
          }`}
        >
          <LayoutGrid size={14} />
          <span className="hidden sm:inline">Home View</span>
        </button>

        {/* Digital Crown Environment Immersion Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowImmersionPopover((v) => !v)}
            title="Digital Crown: Adjust Camera Passthrough vs Virtual Environment Immersion"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 text-white/90 transition-all border border-white/10"
          >
            <Mountain size={13} className="text-sky-300" />
            <span className="hidden md:inline">{currentEnv.name}</span>
            <span className="text-[11px] font-mono text-white/75">{settings.immersionLevel}%</span>
          </button>

          {showImmersionPopover && (
            <div className="absolute left-0 mt-2.5 w-72 rounded-3xl vision-glass-active p-4 text-xs text-white shadow-2xl z-50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white/95">Digital Crown Immersion</span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-white/15">
                  {settings.immersionLevel === 0
                    ? '100% Camera Passthrough'
                    : `${settings.immersionLevel}% Virtual`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.immersionLevel}
                onChange={(e) => onUpdateSettings({ immersionLevel: Number(e.target.value) })}
                className="w-full accent-sky-400 cursor-pointer mb-3"
              />
              <div className="text-[11px] text-white/70 mb-2 font-medium">Spatial Environments:</div>
              <div className="grid grid-cols-2 gap-1.5">
                {SPATIAL_ENVIRONMENTS.map((env) => (
                  <button
                    key={env.id}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        environmentId: env.id as EnvironmentId,
                        immersionLevel: env.id === 'passthrough' ? 0 : Math.max(35, settings.immersionLevel),
                      })
                    }
                    className={`text-left px-2.5 py-1.5 rounded-xl border transition-all truncate ${
                      settings.environmentId === env.id
                        ? 'bg-white/25 border-white/50 text-white font-semibold'
                        : 'bg-white/5 border-white/10 text-white/75 hover:bg-white/15'
                    }`}
                  >
                    {env.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Pill: Camera Passthrough & Real-Time MediaPipe Hand Gesture Status */}
      <div className="pointer-events-auto flex items-center gap-1.5 vision-pill rounded-full px-2.5 py-1.5">
        {/* Rear Camera Passthrough Toggle */}
        <button
          type="button"
          onClick={() => {
            if (!settings.cameraEnabled || cameraStatus !== 'active') {
              onEnterSpatialMode();
            } else {
              onUpdateSettings({ cameraEnabled: false });
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
            cameraStatus === 'active' && settings.cameraEnabled
              ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
              : 'bg-sky-500/30 hover:bg-sky-500/45 border-sky-400/50 text-white'
          }`}
        >
          {cameraStatus === 'active' && settings.cameraEnabled ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Camera size={13} />
              <span className="hidden sm:inline">
                {settings.cameraFacingMode === 'environment' ? 'Rear Cam Live' : 'Front Cam Live'}
              </span>
            </>
          ) : (
            <>
              <CameraOff size={13} />
              <span>Enter Spatial Mode</span>
            </>
          )}
        </button>

        {/* Flip Rear ("environment") / Front ("user") Camera */}
        {settings.cameraEnabled && (
          <button
            type="button"
            onClick={() =>
              onUpdateSettings({
                cameraFacingMode: settings.cameraFacingMode === 'environment' ? 'user' : 'environment',
              })
            }
            title="Switch between Rear (environment) and Front (user) Camera"
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-white/10 hover:bg-white/25 text-white/90 transition-all"
          >
            <RefreshCw size={12} />
            <span className="hidden lg:inline">
              {settings.cameraFacingMode === 'environment' ? 'Rear' : 'Front'}
            </span>
          </button>
        )}

        {/* MediaPipe Hand Tracking Toggle & Active Gesture Badge */}
        <button
          type="button"
          onClick={() => onUpdateSettings({ handTrackingEnabled: !settings.handTrackingEnabled })}
          title="Toggle Real-Time MediaPipe Hand Tracking"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
            !settings.handTrackingEnabled
              ? 'bg-white/5 border-white/10 text-white/50'
              : telemetry.detected
              ? gestureInfo.color
              : 'bg-white/10 border-white/20 text-white/85'
          }`}
        >
          <Hand size={13} className={telemetry.detected ? 'animate-bounce' : ''} />
          <span className="truncate max-w-[130px] sm:max-w-none">
            {!settings.handTrackingEnabled
              ? 'Hands Off'
              : modelStatus === 'loading'
              ? 'Loading MediaPipe...'
              : telemetry.detected
              ? gestureInfo.label
              : 'Hand Tracking Ready'}
          </span>
        </button>
      </div>

      {/* Right Pill: VR Mode + Sound + Settings + Clock */}
      <div className="pointer-events-auto flex items-center gap-1.5 vision-pill rounded-full px-2.5 py-1.5">
        <button
          type="button"
          onClick={onToggleVRMode}
          title="Enter Stereoscopic VR / WebXR Mode"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
            settings.vrMode
              ? 'bg-violet-500 text-white border-violet-300 shadow-[0_0_16px_rgba(139,92,246,0.7)]'
              : 'bg-white/10 hover:bg-white/20 border-white/15 text-white/90'
          }`}
        >
          <Glasses size={14} />
          <span>{settings.vrMode ? 'Exit VR' : 'Enter VR Mode'}</span>
        </button>

        <button
          type="button"
          onClick={() => onUpdateSettings({ soundEffectsEnabled: !settings.soundEffectsEnabled })}
          title="Toggle Spatial Audio UI Sound Effects"
          className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/85 transition-all"
        >
          {settings.soundEffectsEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </button>

        <button
          type="button"
          onClick={onOpenSettingsApp}
          title="Open visionOS Settings"
          className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/85 transition-all"
        >
          <Sliders size={13} />
        </button>

        <span className="hidden sm:inline-block text-xs font-semibold text-white/90 pl-1 pr-1.5 font-mono">
          {timeStr}
        </span>
      </div>
    </header>
  );
};
