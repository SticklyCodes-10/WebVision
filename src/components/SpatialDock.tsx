import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { CORE_APPS } from '../data/initialData';
import { AppId, WindowState } from '../types/vision';
import { AppIconSquircle } from './AppIconSquircle';

interface SpatialDockProps {
  windows: Record<AppId, WindowState>;
  focusedApp: AppId | null;
  showHomeGrid: boolean;
  onToggleHomeGrid: () => void;
  onSelectApp: (id: AppId) => void;
}

export const SpatialDock: React.FC<SpatialDockProps> = ({
  windows,
  focusedApp,
  showHomeGrid,
  onToggleHomeGrid,
  onSelectApp,
}) => {
  return (
    <nav
      aria-label="visionOS Spatial Application Dock"
      className="fixed bottom-3 inset-x-0 z-[85] flex justify-center px-2 pointer-events-none"
    >
      <div className="pointer-events-auto vision-glass-active rounded-full px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-3 max-w-full overflow-x-auto no-scrollbar shadow-[0_28px_70px_rgba(0,0,0,0.72)]">
        {/* Home View (3D App Grid) Launcher Button */}
        <button
          type="button"
          onClick={onToggleHomeGrid}
          title="Toggle 3D Spatial Home View"
          className={`group relative flex flex-col items-center justify-center shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full transition-all duration-200 border ${
            showHomeGrid
              ? 'bg-white text-slate-900 border-white scale-105 shadow-lg'
              : 'bg-white/14 hover:bg-white/25 text-white border-white/30 hover:scale-110'
          }`}
        >
          <LayoutGrid size={21} />
          <span className="pointer-events-none absolute -top-9 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-950/85 text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Home View
          </span>
        </button>

        <div className="w-[1px] h-8 bg-white/20 shrink-0 mx-0.5" />

        {/* 9 Functional Built-in visionOS Applications */}
        {CORE_APPS.map((app) => {
          const win = windows[app.id];
          const isOpen = win?.isOpen;
          const isMinimized = win?.isMinimized;
          const isFocused = focusedApp === app.id && isOpen && !isMinimized;

          return (
            <button
              key={app.id}
              type="button"
              data-dock-app={app.id}
              onClick={() => onSelectApp(app.id)}
              title={`${app.name} — ${app.subtitle}`}
              className="group relative flex flex-col items-center shrink-0 transition-transform duration-200 hover:-translate-y-1.5 hover:scale-110 active:scale-95 focus:outline-none"
            >
              {/* Floating Tooltip Label */}
              <span className="pointer-events-none absolute -top-9 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-950/85 text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                {app.name}
                {isMinimized ? ' (Minimized)' : ''}
              </span>

              <div className="relative">
                <AppIconSquircle
                  appId={app.id}
                  size="md"
                  shape="squircle"
                  className="w-11 h-11 sm:w-12 sm:h-12"
                />
                {isMinimized && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-900 shadow" />
                )}
              </div>

              {/* Active / Focused Running Dot Indicator */}
              <div className="h-2 flex items-center justify-center mt-1">
                {isOpen && (
                  <span
                    className={`rounded-full transition-all duration-200 ${
                      isFocused
                        ? 'w-4 h-1.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]'
                        : isMinimized
                        ? 'w-1.5 h-1.5 bg-amber-300/80'
                        : 'w-1.5 h-1.5 bg-white/60'
                    }`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
