import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  Eye,
  Glasses,
  Sparkles,
  X,
} from 'lucide-react';
import {
  CORE_APPS,
  createInitialWindows,
  DEFAULT_SETTINGS,
  SPATIAL_ENVIRONMENTS,
} from './data/initialData';
import { useCameraAndHands } from './hooks/useCameraAndHands';
import { AppId, VisionOSSettings, WindowState } from './types/vision';
import { spatialAudio } from './utils/soundEffects';
import { EntryPortalModal } from './components/EntryPortalModal';
import { SpatialWindow } from './components/SpatialWindow';
import { HomeAppGrid } from './components/HomeAppGrid';
import { HandCursorOverlay } from './components/HandCursorOverlay';
import { SafariApp } from './components/apps/SafariApp';
import { PhotosApp } from './components/apps/PhotosApp';
import { MusicApp } from './components/apps/MusicApp';
import { SettingsApp } from './components/apps/SettingsApp';
import { MessagesApp } from './components/apps/MessagesApp';
import { NotesApp } from './components/apps/NotesApp';
import { CalendarApp } from './components/apps/CalendarApp';
import { WeatherApp } from './components/apps/WeatherApp';
import { AppStoreApp } from './components/apps/AppStoreApp';

export function App() {
  const [settings, setSettings] = useState<VisionOSSettings>(DEFAULT_SETTINGS);
  const [windows, setWindows] = useState<Record<AppId, WindowState>>(() =>
    createInitialWindows(
      typeof window !== 'undefined' ? window.innerWidth : 1200,
      typeof window !== 'undefined' ? window.innerHeight : 800
    )
  );
  const [focusedApp, setFocusedApp] = useState<AppId | null>('safari');
  const [, setTopZIndex] = useState<number>(20);
  const [showEntryPortal, setShowEntryPortal] = useState<boolean>(true);
  const [showHomeGrid, setShowHomeGrid] = useState<boolean>(false);
  const [gestureToast, setGestureToast] = useState<string | null>(null);
  const [pinchRipples, setPinchRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [webXRSupported, setWebXRSupported] = useState<boolean>(false);
  const [dismissedCameraAlert, setDismissedCameraAlert] = useState<boolean>(false);

  // Refs for hand-pinch window dragging
  const handDraggedWindowRef = useRef<AppId | null>(null);
  const vrVideoCloneRef = useRef<HTMLVideoElement | null>(null);

  const showToast = useCallback((msg: string) => {
    setGestureToast(msg);
  }, []);

  useEffect(() => {
    if (!gestureToast) return;
    const t = setTimeout(() => setGestureToast(null), 2600);
    return () => clearTimeout(t);
  }, [gestureToast]);

  // Check WebXR capability
  useEffect(() => {
    const nav = navigator as Navigator & {
      xr?: { isSessionSupported?: (mode: string) => Promise<boolean> };
    };
    if (nav.xr?.isSessionSupported) {
      Promise.all([
        nav.xr.isSessionSupported('immersive-vr').catch(() => false),
        nav.xr.isSessionSupported('immersive-ar').catch(() => false),
      ]).then(([vrOk, arOk]) => {
        setWebXRSupported(Boolean(vrOk || arOk));
      });
    }
  }, []);

  // Sync CSS glass variables with Appearance settings
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--glass-blur', `${settings.glassBlur}px`);
    root.style.setProperty('--specular-opacity', `${settings.specularIntensity}`);
    root.style.setProperty('--glass-bg-opacity', `${settings.glassOpacity}`);

    const tints: Record<VisionOSSettings['glassTheme'], [number, number, number]> = {
      pure: [255, 255, 255],
      obsidian: [24, 32, 48],
      titanium: [245, 232, 215],
      aurora: [165, 243, 252],
    };
    const [r, g, b] = tints[settings.glassTheme] || tints.pure;
    root.style.setProperty('--glass-tint-r', String(r));
    root.style.setProperty('--glass-tint-g', String(g));
    root.style.setProperty('--glass-tint-b', String(b));
  }, [
    settings.glassBlur,
    settings.specularIntensity,
    settings.glassOpacity,
    settings.glassTheme,
  ]);

  useEffect(() => {
    spatialAudio.setEnabled(settings.soundEffectsEnabled);
  }, [settings.soundEffectsEnabled]);

  // Window Management Actions
  const focusWindow = useCallback((id: AppId) => {
    setFocusedApp(id);
    setTopZIndex((prevZ) => {
      const nextZ = prevZ + 1;
      setWindows((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          zIndex: nextZ,
        },
      }));
      return nextZ;
    });
  }, []);

  const openOrRestoreApp = useCallback((id: AppId) => {
    spatialAudio.playWindowOpen();
    setFocusedApp(id);
    setTopZIndex((prevZ) => {
      const nextZ = prevZ + 1;
      setWindows((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          isOpen: true,
          isMinimized: false,
          zIndex: nextZ,
        },
      }));
      return nextZ;
    });
  }, []);

  const closeWindow = useCallback((id: AppId) => {
    spatialAudio.playWindowClose();
    setWindows((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        isOpen: false,
        isMinimized: false,
      },
    }));
  }, []);

  const minimizeWindow = useCallback((id: AppId) => {
    spatialAudio.playWindowClose();
    setWindows((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        isMinimized: true,
      },
    }));
  }, []);

  const moveWindow = useCallback((id: AppId, x: number, y: number) => {
    setWindows((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        x,
        y,
      },
    }));
  }, []);

  const resizeWindow = useCallback((id: AppId, width: number, height: number) => {
    setWindows((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        width,
        height,
      },
    }));
  }, []);

  const toggleMaximizeWindow = useCallback((id: AppId) => {
    setWindows((prev) => {
      const win = prev[id];
      const maxW = Math.min(window.innerWidth - 24, 920);
      const maxH = Math.min(window.innerHeight - 140, 620);
      const isAlreadyMax = Math.abs(win.width - maxW) < 30 && Math.abs(win.height - maxH) < 30;

      if (isAlreadyMax) {
        const defaults = createInitialWindows(window.innerWidth, window.innerHeight)[id];
        return {
          ...prev,
          [id]: {
            ...win,
            width: defaults.width,
            height: defaults.height,
            x: defaults.x,
            y: defaults.y,
          },
        };
      }

      return {
        ...prev,
        [id]: {
          ...win,
          width: maxW,
          height: maxH,
          x: Math.max(12, Math.round((window.innerWidth - maxW) / 2)),
          y: 56,
        },
      };
    });
  }, []);

  // Real-time MediaPipe Hand Gesture Callbacks
  const handleHandPinchStart = useCallback(
    (x: number, y: number) => {
      // Spawn visual pinch ripple
      const rippleId = Date.now();
      setPinchRipples((prev) => [...prev.slice(-4), { id: rippleId, x, y }]);
      setTimeout(() => {
        setPinchRipples((prev) => prev.filter((r) => r.id !== rippleId));
      }, 600);

      const el = document.elementFromPoint(x, y) as HTMLElement | null;
      if (!el) return;

      // 1. Check if pinching a window drag handle (header bar or bottom grabber pill)
      const dragHandleEl = el.closest('[data-window-drag-handle]') as HTMLElement | null;
      if (dragHandleEl) {
        const winId = dragHandleEl.getAttribute('data-window-drag-handle') as AppId;
        if (winId) {
          focusWindow(winId);
          handDraggedWindowRef.current = winId;
          showToast(`🤏 Pinching & Moving ${CORE_APPS.find((a) => a.id === winId)?.name || winId}`);
          return;
        }
      }

      // 2. Check if pinching an interactive button, dock icon, input, or link
      const interactiveEl = el.closest('button, a, input, textarea, select, label, [role="button"]') as HTMLElement | null;
      if (interactiveEl) {
        interactiveEl.click();
        if (interactiveEl instanceof HTMLInputElement || interactiveEl instanceof HTMLTextAreaElement) {
          interactiveEl.focus();
        }
        return;
      }

      // 3. Otherwise if pinching anywhere on a floating window platter, focus & allow dragging it!
      const windowEl = el.closest('[data-window-id]') as HTMLElement | null;
      if (windowEl) {
        const winId = windowEl.getAttribute('data-window-id') as AppId;
        if (winId) {
          focusWindow(winId);
          handDraggedWindowRef.current = winId;
        }
      }
    },
    [focusWindow, showToast]
  );

  const handleHandPinchMove = useCallback((_x: number, _y: number, dx: number, dy: number) => {
    const draggedId = handDraggedWindowRef.current;
    if (!draggedId) return;

    setWindows((prev) => {
      const win = prev[draggedId];
      if (!win) return prev;
      const nextX = Math.max(
        -win.width * 0.4,
        Math.min(window.innerWidth - win.width * 0.6, win.x + dx)
      );
      const nextY = Math.max(48, Math.min(window.innerHeight - 130, win.y + dy));
      return {
        ...prev,
        [draggedId]: {
          ...win,
          x: Math.round(nextX),
          y: Math.round(nextY),
        },
      };
    });
  }, []);

  const handleHandPinchEnd = useCallback(() => {
    handDraggedWindowRef.current = null;
  }, []);

  // Open Palm Gesture: Show or activate interface / Home View
  const handleOpenPalmTrigger = useCallback(() => {
    setShowHomeGrid((prev) => {
      const next = !prev;
      showToast(
        next
          ? '🖐️ Open Palm Gesture — Summoned Spatial Home View'
          : '🖐️ Open Palm Gesture — Returned to Active Workspace'
      );
      return next;
    });
  }, [showToast]);

  // Closed Fist Gesture: Minimize or close active window
  const handleClosedFistTrigger = useCallback(() => {
    setShowHomeGrid(false);
    setWindows((prev) => {
      const openList = Object.values(prev)
        .filter((w) => w.isOpen && !w.isMinimized)
        .sort((a, b) => b.zIndex - a.zIndex);

      if (openList.length === 0) return prev;
      const target = openList[0];
      showToast(`✊ Closed Fist Gesture — Minimized ${target.title}`);
      return {
        ...prev,
        [target.id]: {
          ...target,
          isMinimized: true,
        },
      };
    });
  }, [showToast]);

  // Two Fingers Gesture: Cycle window focus / navigation
  const handleTwoFingersTrigger = useCallback(() => {
    setShowHomeGrid(false);
    const openIds = Object.values(windows)
      .filter((w) => w.isOpen && !w.isMinimized)
      .map((w) => w.id);

    if (openIds.length === 0) {
      openOrRestoreApp('safari');
      showToast('✌️ Two-Finger Gesture — Opened Safari');
      return;
    }

    const currentIdx = focusedApp ? openIds.indexOf(focusedApp) : 0;
    const nextId = openIds[(currentIdx + 1) % openIds.length];
    focusWindow(nextId);
    const appTitle = CORE_APPS.find((a) => a.id === nextId)?.name || nextId;
    showToast(`✌️ Two-Finger Gesture — Focused ${appTitle}`);
  }, [windows, focusedApp, focusWindow, openOrRestoreApp, showToast]);

  // Initialize Rear Camera + MediaPipe Hand Tracking Hook
  const {
    videoRef,
    cameraStatus,
    cameraErrorMsg,
    activeCameraLabel,
    modelStatus,
    telemetry,
    startCamera,
    captureCameraFrame,
  } = useCameraAndHands({
    cameraEnabled: settings.cameraEnabled,
    facingMode: settings.cameraFacingMode,
    mirrorCamera: settings.mirrorCamera,
    handTrackingEnabled: settings.handTrackingEnabled,
    pinchSensitivity: settings.pinchSensitivity,
    cursorSmoothing: settings.cursorSmoothing,
    onPinchStart: handleHandPinchStart,
    onPinchMove: handleHandPinchMove,
    onPinchEnd: handleHandPinchEnd,
    onOpenPalmTrigger: handleOpenPalmTrigger,
    onClosedFistTrigger: handleClosedFistTrigger,
    onTwoFingersTrigger: handleTwoFingersTrigger,
  });

  // Mirror live camera stream into right-eye VR video element when VR mode is active
  useEffect(() => {
    if (
      settings.vrMode &&
      vrVideoCloneRef.current &&
      videoRef.current &&
      videoRef.current.srcObject
    ) {
      vrVideoCloneRef.current.srcObject = videoRef.current.srcObject;
      vrVideoCloneRef.current.play().catch(() => {});
    }
  }, [settings.vrMode, cameraStatus, videoRef]);

  const updateSettings = useCallback((partial: Partial<VisionOSSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  // Handler for "Enter Spatial Mode" — requests Rear Camera ("environment") + starts MediaPipe
  const handleEnterSpatialMode = useCallback(async () => {
    setShowEntryPortal(false);
    setDismissedCameraAlert(false);
    updateSettings({
      cameraEnabled: true,
      cameraFacingMode: 'environment',
      handTrackingEnabled: true,
      immersionLevel: 15, // Keep background mostly clear for live rear camera passthrough
    });
    const ok = await startCamera('environment');
    if (ok) {
      showToast('📷 Rear Camera Passthrough & MediaPipe Hand Tracking Active');
    }
  }, [startCamera, updateSettings, showToast]);

  // Handler for "Enter VR Mode" — WebXR session check + Stereoscopic Dual-Eye Headset view
  const handleToggleVRMode = useCallback(async () => {
    setShowEntryPortal(false);
    const nextVR = !settings.vrMode;

    if (nextVR) {
      // Ensure rear camera passthrough is requested for AR/VR headset experience
      if (!settings.cameraEnabled) {
        updateSettings({
          cameraEnabled: true,
          cameraFacingMode: 'environment',
          vrMode: true,
        });
        startCamera('environment');
      } else {
        updateSettings({ vrMode: true });
      }

      // Attempt native WebXR session if available on headset browser
      const nav = navigator as Navigator & {
        xr?: {
          isSessionSupported?: (mode: string) => Promise<boolean>;
          requestSession?: (mode: string) => Promise<{ end: () => Promise<void> }>;
        };
      };
      if (nav.xr?.isSessionSupported && nav.xr?.requestSession) {
        try {
          const supported = await nav.xr.isSessionSupported('immersive-vr');
          if (supported) {
            await nav.xr.requestSession('immersive-vr');
          }
        } catch {
          // Graceful fallback to Stereoscopic Side-by-Side VR viewport
        }
      }
      showToast('🥽 Stereoscopic VR Mode Active — Press Esc or Exit VR anytime');
    } else {
      updateSettings({ vrMode: false });
      showToast('Exited VR Mode');
    }
  }, [settings.vrMode, settings.cameraEnabled, updateSettings, startCamera, showToast]);

  // Escape key exits VR mode or closes Home Grid
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (settings.vrMode) updateSettings({ vrMode: false });
        if (showHomeGrid) setShowHomeGrid(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [settings.vrMode, showHomeGrid, updateSettings]);

  const currentEnv =
    SPATIAL_ENVIRONMENTS.find((e) => e.id === settings.environmentId) ||
    SPATIAL_ENVIRONMENTS[1];

  const isCameraFeedVisible = settings.cameraEnabled && cameraStatus === 'active';
  const effectiveEnvOpacity = isCameraFeedVisible ? settings.immersionLevel / 100 : 1;

  // Render content for a specific app ID
  const renderAppContent = (appId: AppId) => {
    switch (appId) {
      case 'safari':
        return <SafariApp />;
      case 'photos':
        return (
          <PhotosApp
            cameraActive={isCameraFeedVisible}
            onCaptureFrame={captureCameraFrame}
            onRequestCamera={handleEnterSpatialMode}
          />
        );
      case 'music':
        return <MusicApp />;
      case 'settings':
        return (
          <SettingsApp
            settings={settings}
            cameraStatus={cameraStatus}
            activeCameraLabel={activeCameraLabel}
            modelStatus={modelStatus}
            telemetry={telemetry}
            webXRSupported={webXRSupported}
            onUpdateSettings={updateSettings}
            onRestartCamera={() => startCamera(settings.cameraFacingMode)}
            onResetWindows={() => {
              setWindows(createInitialWindows(window.innerWidth, window.innerHeight));
              showToast('Recentered all spatial windows');
            }}
            onCloseAllWindows={() => {
              setWindows((prev) => {
                const copy = { ...prev };
                (Object.keys(copy) as AppId[]).forEach((k) => {
                  copy[k] = { ...copy[k], isOpen: false, isMinimized: false };
                });
                return copy;
              });
              showToast('Closed all open windows');
            }}
            onResetAllSettings={() => {
              setSettings(DEFAULT_SETTINGS);
              setWindows(createInitialWindows(window.innerWidth, window.innerHeight));
              showToast('Restored visionOS factory settings');
            }}
          />
        );
      case 'messages':
        return <MessagesApp />;
      case 'notes':
        return <NotesApp />;
      case 'calendar':
        return <CalendarApp />;
      case 'weather':
        return <WeatherApp />;
      case 'appstore':
        return <AppStoreApp onLaunchCoreApp={openOrRestoreApp} />;
      default:
        return null;
    }
  };

  const activeFocusedAppId =
    focusedApp && windows[focusedApp]?.isOpen && !windows[focusedApp]?.isMinimized
      ? focusedApp
      : (Object.values(windows).find((w) => w.isOpen && !w.isMinimized)?.id ?? 'safari');

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080B11] select-none">
      {/* LAYER 0: Live Smartphone Rear Camera Feed (facingMode: "environment") */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`fixed inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          isCameraFeedVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          transform:
            settings.mirrorCamera || settings.cameraFacingMode === 'user'
              ? 'scaleX(-1)'
              : 'none',
        }}
      />

      {/* LAYER 1: Virtual Spatial Environment Backdrop (Blended via Digital Crown Immersion Dial) */}
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: effectiveEnvOpacity,
          background: currentEnv.bgStyle,
        }}
      >
        {currentEnv.imageUrl && (
          <img
            src={currentEnv.imageUrl}
            alt={currentEnv.name}
            className="w-full h-full object-cover opacity-65 mix-blend-luminosity scale-105"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 25%, ${currentEnv.ambientGlow}, rgba(5, 8, 16, 0.72))`,
          }}
        />
      </div>

      {/* Subtle Spatial Vignette for Glass Legibility Over Bright Camera Feeds */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.38) 100%)',
        }}
      />


      {/* Graceful Camera Permission / Fallback Banner */}
      {settings.cameraEnabled &&
        (cameraStatus === 'denied' || cameraStatus === 'error') &&
        !dismissedCameraAlert && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[95] max-w-md w-[92%] rounded-2xl vision-glass-active px-4 py-2.5 text-xs text-white flex items-center justify-between gap-3 shadow-2xl border border-amber-400/40">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-300 shrink-0" />
              <span>{cameraErrorMsg}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => startCamera(settings.cameraFacingMode)}
                className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 font-semibold"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => setDismissedCameraAlert(true)}
                className="p-1 rounded-full hover:bg-white/15"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}

      {/* Floating Spatial Gesture Notification Pill */}
      {gestureToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[110] pointer-events-none px-4 py-1.5 rounded-full vision-glass-active text-xs font-semibold text-white shadow-2xl border border-white/35 flex items-center gap-2 animate-bounce">
          <Sparkles size={13} className="text-sky-300" />
          <span>{gestureToast}</span>
        </div>
      )}

      {/* Pinch Click Visual Ripples */}
      {pinchRipples.map((r) => (
        <div
          key={r.id}
          className="fixed pointer-events-none z-[125] w-10 h-10 -ml-5 -mt-5 rounded-full border-2 border-emerald-300 bg-emerald-400/25 animate-ping"
          style={{ left: `${r.x}px`, top: `${r.y}px` }}
        />
      ))}

      {/* STEREOSCOPIC VR HEADSET VIEW OR NORMAL SPATIAL WORKSPACE */}
      {settings.vrMode ? (
        <div className="fixed inset-0 z-[75] bg-black flex flex-col pt-12 pb-3 px-2 sm:px-4">
          {/* VR Top Telemetry Strip */}
          <div className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-full bg-white/10 border border-white/15 text-xs text-white">
            <div className="flex items-center gap-2">
              <Glasses size={15} className="text-violet-300" />
              <span className="font-semibold">Stereoscopic VR Headset Mode</span>
              <span className="hidden sm:inline text-white/65">
                · IPD {settings.vrIpdOffset}mm · Focused App:{' '}
                <strong className="text-white uppercase">{activeFocusedAppId}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1">
                {CORE_APPS.slice(0, 5).map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => openOrRestoreApp(app.id)}
                    className={`px-2 py-0.5 rounded-full text-[10px] ${
                      activeFocusedAppId === app.id
                        ? 'bg-violet-500 text-white font-semibold'
                        : 'bg-white/10 text-white/75'
                    }`}
                  >
                    {app.name}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => updateSettings({ vrMode: false })}
                className="px-3 py-1 rounded-full bg-rose-500 hover:bg-rose-400 text-white font-semibold text-xs"
              >
                Exit VR
              </button>
            </div>
          </div>

          {/* Dual-Eye Side-by-Side (SBS) Optical Viewport */}
          <div
            className="flex-1 grid grid-cols-2 items-center justify-center min-h-0"
            style={{
              gap: `${Math.max(6, (settings.vrIpdOffset - 54) * 1.1)}px`,
            }}
          >
            {/* LEFT EYE VIEWPORT */}
            <div
              className={`relative w-full h-full flex items-center justify-center p-2 sm:p-4 ${
                settings.vrLensDistortion ? 'vr-eye-lens' : 'rounded-3xl overflow-hidden border border-white/20'
              }`}
              style={{
                background: currentEnv.bgStyle,
              }}
            >
              {isCameraFeedVisible && (
                <div className="absolute inset-0 flex items-center justify-center opacity-45 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 text-[10px] text-emerald-300 border border-emerald-400/40">
                    Left Eye Optical Passthrough Active
                  </span>
                </div>
              )}
              <div className="relative z-10 w-full h-full max-h-[420px] rounded-3xl vision-glass-active overflow-hidden flex flex-col border border-white/35 shadow-2xl">
                <div className="px-3 py-1.5 border-b border-white/15 flex items-center justify-between text-[11px] font-semibold bg-white/5">
                  <span className="flex items-center gap-1.5">
                    <Eye size={12} className="text-sky-300" />
                    Left Eye · {CORE_APPS.find((a) => a.id === activeFocusedAppId)?.name}
                  </span>
                  <span className="text-[10px] text-white/60">Stereoscopic L</span>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  {renderAppContent(activeFocusedAppId)}
                </div>
              </div>
            </div>

            {/* RIGHT EYE VIEWPORT */}
            <div
              className={`relative w-full h-full flex items-center justify-center p-2 sm:p-4 ${
                settings.vrLensDistortion ? 'vr-eye-lens' : 'rounded-3xl overflow-hidden border border-white/20'
              }`}
              style={{
                background: currentEnv.bgStyle,
              }}
            >
              {isCameraFeedVisible && (
                <video
                  ref={vrVideoCloneRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
                />
              )}
              <div className="relative z-10 w-full h-full max-h-[420px] rounded-3xl vision-glass-active overflow-hidden flex flex-col border border-white/35 shadow-2xl">
                <div className="px-3 py-1.5 border-b border-white/15 flex items-center justify-between text-[11px] font-semibold bg-white/5">
                  <span className="flex items-center gap-1.5">
                    <Eye size={12} className="text-violet-300" />
                    Right Eye · {CORE_APPS.find((a) => a.id === activeFocusedAppId)?.name}
                  </span>
                  <span className="text-[10px] text-white/60">Stereoscopic R</span>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  {renderAppContent(activeFocusedAppId)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* NORMAL SPATIAL COMPUTING MODE (Floating Windows over Live Rear Camera / Spatial Environment) */
        <main className="relative w-full h-full">
          {/* Empty Workspace Helper Pill if all windows are closed/minimized */}
          {Object.values(windows).every((w) => !w.isOpen || w.isMinimized) && !showHomeGrid && (
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-20 p-4">
              <div className="pointer-events-auto rounded-3xl vision-glass-active p-6 text-center max-w-sm space-y-3">
                <Sparkles size={24} className="mx-auto text-sky-300" />
                <h2 className="text-base font-bold text-white">Spatial Workspace Clear</h2>
                <p className="text-xs text-white/75">
                  Hold up an Open Palm gesture to summon Home View, then select an app.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowHomeGrid(true)}
                    className="px-4 py-2 rounded-full bg-white text-slate-950 text-xs font-semibold"
                  >
                    Open Home View
                  </button>
                  {!isCameraFeedVisible && (
                    <button
                      type="button"
                      onClick={handleEnterSpatialMode}
                      className="px-4 py-2 rounded-full bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Camera size={13} />
                      <span>Enter Spatial Mode</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Render All Open Spatial Windows */}
          {(Object.keys(windows) as AppId[]).map((appId) => {
            const win = windows[appId];
            return (
              <SpatialWindow
                key={appId}
                windowState={win}
                isFocused={focusedApp === appId}
                depthTiltEnabled={settings.depthTiltEnabled}
                uiScale={settings.uiScale}
                onFocus={focusWindow}
                onClose={closeWindow}
                onMinimize={minimizeWindow}
                onMove={moveWindow}
                onResize={resizeWindow}
                onMaximizeToggle={toggleMaximizeWindow}
              >
                {renderAppContent(appId)}
              </SpatialWindow>
            );
          })}
        </main>
      )}

      {/* 3D Floating Home App Grid Overlay */}
      <HomeAppGrid
        isOpen={showHomeGrid}
        windows={windows}
        onSelectApp={openOrRestoreApp}
        onCloseHomeGrid={() => setShowHomeGrid(false)}
      />


      {/* Real-Time MediaPipe Hand Cursor Reticle & 21-Point Skeleton HUD */}
      <HandCursorOverlay
        telemetry={telemetry}
        showHandSkeleton={settings.showHandSkeleton}
        pinchSensitivity={settings.pinchSensitivity}
        handTrackingEnabled={settings.handTrackingEnabled}
        cameraActive={isCameraFeedVisible}
      />

      {/* Quick Bottom-Left Spatial Mode / Gesture Helper Badge when Camera is Off */}
      {!isCameraFeedVisible && !showEntryPortal && (
        <div className="fixed bottom-20 left-3 z-[82] flex items-center gap-2">
          <button
            type="button"
            onClick={handleEnterSpatialMode}
            className="vision-pill rounded-full px-3.5 py-2 text-xs font-semibold text-white flex items-center gap-2 hover:scale-105 active:scale-95 transition-all border border-sky-400/50 shadow-xl"
          >
            <Camera size={14} className="text-sky-300" />
            <span>Enter Spatial Mode (Rear Camera + Hands)</span>
          </button>
        </div>
      )}

      {/* Initial Entry Portal Modal */}
      <EntryPortalModal
        isOpen={showEntryPortal}
        onEnterSpatialMode={handleEnterSpatialMode}
        onEnterVRMode={handleToggleVRMode}
        onContinueTouchMode={() => setShowEntryPortal(false)}
      />
    </div>
  );
}

export default App;
