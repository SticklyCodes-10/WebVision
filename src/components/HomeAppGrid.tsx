import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { CORE_APPS } from '../data/initialData';
import { AppId, WindowState } from '../types/vision';
import { AppIconSquircle } from './AppIconSquircle';

interface HomeAppGridProps {
  isOpen: boolean;
  windows: Record<AppId, WindowState>;
  onSelectApp: (id: AppId) => void;
  onCloseHomeGrid: () => void;
}

export const HomeAppGrid: React.FC<HomeAppGridProps> = ({
  isOpen,
  windows,
  onSelectApp,
  onCloseHomeGrid,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onCloseHomeGrid}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/35 backdrop-blur-md animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-2xl w-full rounded-[42px] vision-glass-active p-6 sm:p-10 text-center shadow-[0_40px_100px_rgba(0,0,0,0.78)] border border-white/35"
        style={{
          transform: 'perspective(1000px) rotateX(2deg)',
        }}
      >
        <button
          type="button"
          onClick={onCloseHomeGrid}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white/85 border border-white/20 transition-all"
          title="Dismiss Home View"
        >
          <X size={16} />
        </button>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/12 border border-white/20 text-xs font-medium text-white/90 mb-2">
          <Sparkles size={13} className="text-sky-300" />
          <span>visionOS Spatial Home View</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white mb-1">
          Look or Pinch to Launch
        </h2>
        <p className="text-xs sm:text-sm text-white/70 mb-7">
          Tap, click, or pinch any spatial app icon to summon its floating glass window
        </p>

        {/* Honeycomb-inspired 3D Spatial Grid of Circular Icons */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-y-6 gap-x-4 sm:gap-x-8 max-w-lg mx-auto">
          {CORE_APPS.map((app) => {
            const win = windows[app.id];
            const isRunning = win?.isOpen && !win?.isMinimized;
            const isMinimized = win?.isOpen && win?.isMinimized;

            return (
              <button
                key={app.id}
                type="button"
                onClick={() => {
                  onSelectApp(app.id);
                  onCloseHomeGrid();
                }}
                className="group flex flex-col items-center justify-center focus:outline-none transition-transform duration-200 hover:scale-110 active:scale-95"
              >
                <div className="relative mb-2.5">
                  <AppIconSquircle
                    appId={app.id}
                    size="lg"
                    shape="circle"
                    className="group-hover:shadow-[0_0_32px_rgba(255,255,255,0.45)] transition-shadow"
                  />
                  {isRunning && (
                    <span className="absolute -bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 shadow" />
                  )}
                  {isMinimized && (
                    <span className="absolute -bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-900 shadow" />
                  )}
                </div>
                <span className="text-xs sm:text-sm font-medium text-white/95 tracking-tight group-hover:text-white">
                  {app.name}
                </span>
                <span className="text-[10px] text-white/55 hidden sm:block truncate max-w-[130px]">
                  {app.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
