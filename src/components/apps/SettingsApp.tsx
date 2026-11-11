import React, { useState } from 'react';
import {
  Camera,
  Eye,
  Glasses,
  Hand,
  Palette,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { SPATIAL_ENVIRONMENTS } from '../../data/initialData';
import {
  EnvironmentId,
  GlassTintTheme,
  HandTelemetry,
  VisionOSSettings,
} from '../../types/vision';

interface SettingsAppProps {
  settings: VisionOSSettings;
  cameraStatus: 'idle' | 'requesting' | 'active' | 'denied' | 'error';
  activeCameraLabel: string;
  modelStatus: 'idle' | 'loading' | 'ready' | 'error';
  telemetry: HandTelemetry;
  webXRSupported: boolean;
  onUpdateSettings: (partial: Partial<VisionOSSettings>) => void;
  onRestartCamera: () => void;
  onResetWindows: () => void;
  onCloseAllWindows: () => void;
  onResetAllSettings: () => void;
}

type SettingsTab = 'camera' | 'hands' | 'appearance' | 'vr' | 'reset';

export const SettingsApp: React.FC<SettingsAppProps> = ({
  settings,
  cameraStatus,
  activeCameraLabel,
  modelStatus,
  telemetry,
  webXRSupported,
  onUpdateSettings,
  onRestartCamera,
  onResetWindows,
  onCloseAllWindows,
  onResetAllSettings,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('camera');

  const navItems: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'camera', label: 'Camera & Space', icon: <Camera size={14} /> },
    { id: 'hands', label: 'Hand Tracking', icon: <Hand size={14} /> },
    { id: 'appearance', label: 'Glass & Display', icon: <Palette size={14} /> },
    { id: 'vr', label: 'VR & WebXR', icon: <Glasses size={14} /> },
    { id: 'reset', label: 'Reset & Layout', icon: <RotateCcw size={14} /> },
  ];

  return (
    <div className="flex flex-col sm:flex-row h-full w-full text-white overflow-hidden">
      {/* Left Sidebar Navigation */}
      <div className="sm:w-46 border-b sm:border-b-0 sm:border-r border-white/12 bg-white/[0.03] p-2.5 flex sm:flex-col gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === item.id
                ? 'bg-white text-slate-950 font-semibold shadow-md'
                : 'bg-white/[0.04] hover:bg-white/12 text-white/80'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Right Settings Panel */}
      <div className="flex-1 spatial-scroll p-4 space-y-4">
        {activeTab === 'camera' && (
          <div className="space-y-3.5">
            <div className="vision-card rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Live Camera Optical Passthrough</h3>
                  <p className="text-[11px] text-white/70">
                    Uses <code className="text-sky-300">getUserMedia()</code> with rear environment camera
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ cameraEnabled: !settings.cameraEnabled })}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    settings.cameraEnabled
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-sky-500 text-white'
                  }`}
                >
                  {settings.cameraEnabled ? 'Camera Enabled' : 'Enable Camera'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({ cameraEnabled: true, cameraFacingMode: 'environment' })
                  }
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    settings.cameraFacingMode === 'environment'
                      ? 'bg-sky-500/25 border-sky-400 text-white font-semibold'
                      : 'bg-white/5 border-white/12 text-white/70'
                  }`}
                >
                  <div className="text-xs">Rear Camera (Default)</div>
                  <div className="text-[10px] text-white/60 font-mono">facingMode: &quot;environment&quot;</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({ cameraEnabled: true, cameraFacingMode: 'user' })
                  }
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    settings.cameraFacingMode === 'user'
                      ? 'bg-sky-500/25 border-sky-400 text-white font-semibold'
                      : 'bg-white/5 border-white/12 text-white/70'
                  }`}
                >
                  <div className="text-xs">Front Selfie Camera</div>
                  <div className="text-[10px] text-white/60 font-mono">facingMode: &quot;user&quot;</div>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs border-t border-white/10">
                <div className="text-white/75">
                  Status:{' '}
                  <span className="font-semibold text-white uppercase">{cameraStatus}</span> ·{' '}
                  <span className="text-white/60">{activeCameraLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.mirrorCamera}
                      onChange={(e) => onUpdateSettings({ mirrorCamera: e.target.checked })}
                      className="accent-sky-400"
                    />
                    <span className="text-[11px]">Mirror Video</span>
                  </label>
                  <button
                    type="button"
                    onClick={onRestartCamera}
                    className="px-2.5 py-1 rounded-full bg-white/12 hover:bg-white/20 text-[11px] flex items-center gap-1"
                  >
                    <RefreshCw size={11} />
                    <span>Reconnect</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Environment & Digital Crown Immersion */}
            <div className="vision-card rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Digital Crown Virtual Immersion</span>
                <span className="text-xs font-mono text-sky-300">{settings.immersionLevel}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.immersionLevel}
                onChange={(e) => onUpdateSettings({ immersionLevel: Number(e.target.value) })}
                className="w-full accent-sky-400"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SPATIAL_ENVIRONMENTS.map((env) => (
                  <button
                    key={env.id}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        environmentId: env.id as EnvironmentId,
                        immersionLevel: env.id === 'passthrough' ? 0 : Math.max(40, settings.immersionLevel),
                      })
                    }
                    className={`p-2 rounded-xl border text-left text-xs transition-all ${
                      settings.environmentId === env.id
                        ? 'bg-white/22 border-white/50 text-white font-semibold'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/12'
                    }`}
                  >
                    <div className="truncate">{env.name}</div>
                    <div className="text-[10px] text-white/50 truncate">{env.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hands' && (
          <div className="space-y-3.5">
            <div className="vision-card rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">MediaPipe Hand Tracking</h3>
                  <p className="text-[11px] text-white/70">
                    21-keypoint GPU/CPU tracking · Status:{' '}
                    <span className="text-sky-300 uppercase font-semibold">{modelStatus}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ handTrackingEnabled: !settings.handTrackingEnabled })}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    settings.handTrackingEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-white/15 text-white'
                  }`}
                >
                  {settings.handTrackingEnabled ? 'Tracking Active' : 'Tracking Paused'}
                </button>
              </div>
              <p className="text-[10px] text-white/55">
                MediaPipe HandLandmarker uses GPU acceleration when available and automatically falls back to CPU.
              </p>
              {/* Pinch Sensitivity Slider */}
        {activeTab === 'appearance' && (
          <div className="space-y-3.5">
            <div className="vision-card rounded-2xl p-3.5 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Sparkles size={14} className="text-sky-300" />
                <span>visionOS Material & Frosted Glass Shader</span>
              </h3>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Backdrop Frosted Blur Radius</span>
                  <span className="font-mono text-sky-300">{settings.glassBlur}px</span>
                </div>
                <input
                  type="range"
                  min={16}
                  max={64}
                  value={settings.glassBlur}
                  onChange={(e) => onUpdateSettings({ glassBlur: Number(e.target.value) })}
                  className="w-full accent-sky-400"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Specular Rim Highlight Intensity</span>
                  <span className="font-mono text-sky-300">
                    {Math.round(settings.specularIntensity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.15}
                  max={0.8}
                  step={0.05}
                  value={settings.specularIntensity}
                  onChange={(e) =>
                    onUpdateSettings({ specularIntensity: Number(e.target.value) })
                  }
                  className="w-full accent-sky-400"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Window Platter Luminance Opacity</span>
                  <span className="font-mono text-sky-300">
                    {Math.round(settings.glassOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.08}
                  max={0.34}
                  step={0.02}
                  value={settings.glassOpacity}
                  onChange={(e) => onUpdateSettings({ glassOpacity: Number(e.target.value) })}
                  className="w-full accent-sky-400"
                />
              </div>

              {/* Glass Tint Themes */}
              <div className="pt-2 border-t border-white/10">
                <div className="text-xs font-medium mb-2">Glass Tint Finish</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'pure', label: 'Pure Glass' },
                      { id: 'obsidian', label: 'Obsidian Dark' },
                      { id: 'titanium', label: 'Warm Titanium' },
                      { id: 'aurora', label: 'Aurora Cyan' },
                    ] as { id: GlassTintTheme; label: string }[]
                  ).map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => onUpdateSettings({ glassTheme: theme.id })}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition-all ${
                        settings.glassTheme === theme.id
                          ? 'bg-white text-slate-950 border-white font-semibold'
                          : 'bg-white/8 border-white/15 text-white/80 hover:bg-white/15'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3D Tilt & UI Scale */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.depthTiltEnabled}
                    onChange={(e) =>
                      onUpdateSettings({ depthTiltEnabled: e.target.checked })
                    }
                    className="accent-sky-400 w-4 h-4"
                  />
                  <span>3D Perspective Window Depth Tilt</span>
                </label>

                <div className="flex items-center gap-1">
                  {(['compact', 'default', 'spacious'] as const).map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => onUpdateSettings({ uiScale: sc })}
                      className={`px-2.5 py-1 rounded-full text-[11px] capitalize ${
                        settings.uiScale === sc
                          ? 'bg-sky-500 text-white font-semibold'
                          : 'bg-white/10 text-white/70'
                      }`}
                    >
                      {sc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vr' && (
          <div className="space-y-3.5">
            <div className="vision-card rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Stereoscopic VR & WebXR Mode</h3>
                  <p className="text-[11px] text-white/70">
                    Side-by-Side (SBS) dual-eye viewport for mobile VR headsets · WebXR API:{' '}
                    <span className="text-violet-300 font-semibold">
                      {webXRSupported ? 'Supported' : 'Stereoscopic Fallback Active'}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ vrMode: !settings.vrMode })}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    settings.vrMode
                      ? 'bg-violet-500 text-white shadow-lg'
                      : 'bg-white/15 hover:bg-white/25 text-white'
                  }`}
                >
                  {settings.vrMode ? 'Exit VR Mode' : 'Enter VR Mode'}
                </button>
              </div>

              <div className="space-y-1 pt-2 border-t border-white/10">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <Eye size={13} className="text-violet-300" />
                    <span>Interpupillary Distance (IPD Offset)</span>
                  </span>
                  <span className="font-mono text-violet-300">{settings.vrIpdOffset} mm</span>
                </div>
                <input
                  type="range"
                  min={56}
                  max={72}
                  value={settings.vrIpdOffset}
                  onChange={(e) => onUpdateSettings({ vrIpdOffset: Number(e.target.value) })}
                  className="w-full accent-violet-400"
                />
              </div>

              <label className="flex items-center justify-between pt-2 border-t border-white/10 text-xs cursor-pointer">
                <span>Apply Optical Barrel Lens Vignette in VR Mode</span>
                <input
                  type="checkbox"
                  checked={settings.vrLensDistortion}
                  onChange={(e) => onUpdateSettings({ vrLensDistortion: e.target.checked })}
                  className="accent-violet-400 w-4 h-4"
                />
              </label>
            </div>
          </div>
        )}

        {activeTab === 'reset' && (
          <div className="space-y-3">
            <div className="vision-card rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">Spatial Workspace & System Reset</h3>
              <p className="text-xs text-white/70">
                Recenter floating windows in your field of view or restore all visionOS settings to factory defaults.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onResetWindows}
                  className="p-3 rounded-2xl bg-sky-500/25 hover:bg-sky-500/40 border border-sky-400/40 text-xs font-semibold text-white transition-all"
                >
                  Recenter Windows
                </button>

                <button
                  type="button"
                  onClick={onCloseAllWindows}
                  className="p-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/40 text-xs font-semibold text-amber-100 transition-all"
                >
                  Close All Windows
                </button>

                <button
                  type="button"
                  onClick={onResetAllSettings}
                  className="p-3 rounded-2xl bg-rose-500/25 hover:bg-rose-500/40 border border-rose-400/40 text-xs font-semibold text-rose-100 transition-all"
                >
                  Factory Reset OS
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
