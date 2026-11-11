import React, { useRef, useState } from 'react';
import { Maximize2, Minus, X } from 'lucide-react';
import { AppId, WindowState } from '../types/vision';
import { AppIconSquircle } from './AppIconSquircle';

interface SpatialWindowProps {
  windowState: WindowState;
  isFocused: boolean;
  depthTiltEnabled: boolean;
  uiScale: 'compact' | 'default' | 'spacious';
  onFocus: (id: AppId) => void;
  onClose: (id: AppId) => void;
  onMinimize: (id: AppId) => void;
  onMove: (id: AppId, x: number, y: number) => void;
  onResize: (id: AppId, width: number, height: number) => void;
  onMaximizeToggle: (id: AppId) => void;
  children: React.ReactNode;
}

const SpatialWindowComponent: React.FC<SpatialWindowProps> = ({
  windowState,
  isFocused,
  depthTiltEnabled,
  uiScale,
  onFocus,
  onClose,
  onMinimize,
  onMove,
  onResize,
  onMaximizeToggle,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const [chromeHovered, setChromeHovered] = useState(false);

  const dragOffsetRef = useRef<{ startX: number; startY: number; origX: number; origY: number }>({
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  const resizeStartRef = useRef<{ startX: number; startY: number; origW: number; origH: number }>({
    startX: 0,
    startY: 0,
    origW: 0,
    origH: 0,
  });

  if (!windowState.isOpen || windowState.isMinimized) {
    return null;
  }

  const scaleMultiplier = uiScale === 'compact' ? 0.94 : uiScale === 'spacious' ? 1.05 : 1;

  // Pointer drag handler (works for both Touchscreen and Mouse)
  const handleStartDrag = (e: React.PointerEvent) => {
    e.stopPropagation();
    onFocus(windowState.id);
    setIsDragging(true);

    dragOffsetRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: windowState.x,
      origY: windowState.y,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - dragOffsetRef.current.startX;
      const dy = moveEvent.clientY - dragOffsetRef.current.startY;
      const nextX = Math.max(
        -windowState.width * 0.45,
        Math.min(window.innerWidth - windowState.width * 0.55, dragOffsetRef.current.origX + dx)
      );
      const nextY = Math.max(46, Math.min(window.innerHeight - 130, dragOffsetRef.current.origY + dy));
      onMove(windowState.id, Math.round(nextX), Math.round(nextY));
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Pointer resize handler (works for both Touchscreen and Mouse)
  const handleStartResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    onFocus(windowState.id);
    setIsResizing(true);

    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origW: windowState.width,
      origH: windowState.height,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - resizeStartRef.current.startX;
      const dy = moveEvent.clientY - resizeStartRef.current.startY;
      const nextW = Math.max(
        windowState.minWidth,
        Math.min(window.innerWidth - 16, resizeStartRef.current.origW + dx)
      );
      const nextH = Math.max(
        windowState.minHeight,
        Math.min(window.innerHeight - 140, resizeStartRef.current.origH + dy)
      );
      onResize(windowState.id, Math.round(nextW), Math.round(nextH));
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Subtle 3D spatial tilt on pointer move
  const handlePointerMoveTilt = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!depthTiltEnabled || isDragging || isResizing) {
      if (tilt.rx !== 0 || tilt.ry !== 0) setTilt({ rx: 0, ry: 0 });
      return;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: Number((-normY * 2.8).toFixed(2)),
      ry: Number((normX * 3.2).toFixed(2)),
    });
  };

  const handlePointerLeaveTilt = () => {
    if (tilt.rx !== 0 || tilt.ry !== 0) {
      setTilt({ rx: 0, ry: 0 });
    }
  };

  return (
    <div
      ref={containerRef}
      data-window-id={windowState.id}
      onPointerDown={() => onFocus(windowState.id)}
      onPointerMove={handlePointerMoveTilt}
      onPointerLeave={handlePointerLeaveTilt}
      className="fixed select-none"
      style={{
        left: `${windowState.x}px`,
        top: `${windowState.y}px`,
        width: `${windowState.width}px`,
        height: `${windowState.height}px`,
        zIndex: windowState.zIndex,
        transform: `perspective(1200px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${
          isDragging ? scaleMultiplier * 1.018 : scaleMultiplier
        })`,
        transition:
          isDragging || isResizing
            ? 'none'
            : 'transform 0.24s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease',
      }}
    >
      {/* Main Frosted Glass Platter */}
      <div
        className={`relative w-full h-full rounded-[32px] flex flex-col overflow-hidden transition-colors duration-200 ${
          isFocused ? 'vision-glass-active' : 'vision-glass opacity-92'
        }`}
      >
        {/* Top Window Header Bar (Also draggable via touch/mouse/hand pinch) */}
        <div
          data-window-drag-handle={windowState.id}
          onPointerDown={handleStartDrag}
          onDoubleClick={() => onMaximizeToggle(windowState.id)}
          className="flex items-center justify-between px-4 py-2.5 border-b border-white/14 bg-white/[0.04] cursor-grab active:cursor-grabbing shrink-0"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AppIconSquircle appId={windowState.id} size="sm" shape="circle" className="w-7 h-7 shrink-0" />
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold tracking-tight text-white/95 truncate">
                  {windowState.title}
                </span>
                {isFocused && (
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-white/14 text-white/80 border border-white/15">
                    Spatial
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Top-right Window Action Pills for quick accessibility on touch/desktop */}
          <div
            className="flex items-center gap-1.5"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => onMinimize(windowState.id)}
              title="Minimize Window"
              className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/25 text-white/80 hover:text-white transition-all border border-white/15"
            >
              <Minus size={13} />
            </button>
            <button
              type="button"
              onClick={() => onMaximizeToggle(windowState.id)}
              title="Expand / Fit Space"
              className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/25 text-white/80 hover:text-white transition-all border border-white/15"
            >
              <Maximize2 size={12} />
            </button>
            <button
              type="button"
              onClick={() => onClose(windowState.id)}
              title="Close Window"
              className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-rose-500/80 text-white/80 hover:text-white transition-all border border-white/15"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Main Application Content Viewport */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden flex flex-col">
          {children}
        </div>
      </div>

      {/* Authentic visionOS Bottom Spatial Chrome Bar (Close Dot + Grabber Bar + Curved Resize Arc) */}
      <div
        onMouseEnter={() => setChromeHovered(true)}
        onMouseLeave={() => setChromeHovered(false)}
        className="absolute -bottom-6 inset-x-0 flex items-center justify-center gap-3 pointer-events-none z-30"
      >
        {/* Close Dot & Minimize Dot (visionOS style below window) */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose(windowState.id);
            }}
            title="Close Window (visionOS Close Dot)"
            className={`group flex items-center justify-center rounded-full bg-white/40 hover:bg-rose-500/90 backdrop-blur-xl border border-white/45 shadow-lg transition-all duration-200 ${
              chromeHovered ? 'w-6 h-6' : 'w-3.5 h-3.5 hover:w-6 hover:h-6'
            }`}
          >
            <X
              size={12}
              className={`text-white transition-opacity duration-150 ${
                chromeHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize(windowState.id);
            }}
            title="Minimize Window"
            className={`group flex items-center justify-center rounded-full bg-white/35 hover:bg-amber-400/90 backdrop-blur-xl border border-white/45 shadow-lg transition-all duration-200 ${
              chromeHovered ? 'w-6 h-6' : 'w-3.5 h-3.5 hover:w-6 hover:h-6'
            }`}
          >
            <Minus
              size={12}
              className={`text-white transition-opacity duration-150 ${
                chromeHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            />
          </button>
        </div>

        {/* Iconic visionOS Center Grabber Bar (Pinch or Drag to Move Window) */}
        <div
          data-window-drag-handle={windowState.id}
          onPointerDown={handleStartDrag}
          title="Pinch or Drag Grabber Bar to Move Window"
          className={`pointer-events-auto cursor-grab active:cursor-grabbing rounded-full transition-all duration-200 flex items-center justify-center py-2 px-2`}
        >
          <div
            className={`h-1.5 rounded-full transition-all duration-200 shadow-[0_2px_12px_rgba(255,255,255,0.45)] ${
              isDragging
                ? 'w-40 bg-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.9)]'
                : isFocused
                ? 'w-32 sm:w-36 bg-white/75 hover:bg-white hover:w-40'
                : 'w-28 bg-white/40 hover:bg-white/75'
            }`}
          />
        </div>
      </div>

      {/* Bottom-Right Curved Corner Resize Arc (visionOS signature resize handle) */}
      <div
        onPointerDown={handleStartResize}
        title="Drag Corner Arc to Resize Window"
        className="absolute -bottom-2.5 -right-2.5 w-8 h-8 cursor-nwse-resize flex items-end justify-end p-1 z-30 group"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          className="transition-transform duration-150 group-hover:scale-125 drop-shadow-[0_2px_8px_rgba(255,255,255,0.6)]"
        >
          <path
            d="M 6 20 A 14 14 0 0 0 20 6"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};

export const SpatialWindow = React.memo(SpatialWindowComponent);
