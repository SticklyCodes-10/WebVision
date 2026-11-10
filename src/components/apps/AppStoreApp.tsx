import React, { useState } from 'react';
import { Check, Download, Search, Sparkles, Star } from 'lucide-react';
import { STORE_APPS } from '../../data/initialData';
import { AppId, StoreAppItem } from '../../types/vision';

interface AppStoreAppProps {
  onLaunchCoreApp: (id: AppId) => void;
}

export const AppStoreApp: React.FC<AppStoreAppProps> = ({ onLaunchCoreApp }) => {
  const [apps, setApps] = useState<StoreAppItem[]>(STORE_APPS);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState<string>('');

  const categories = ['All', 'Spatial Experiences', 'Productivity', 'Astronomy'];

  const filteredApps = apps.filter((item) => {
    const matchesCat = category === 'All' || item.category === category;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleInstallOrOpen = (app: StoreAppItem) => {
    if (app.installed) {
      if (app.linkedCoreApp) {
        onLaunchCoreApp(app.linkedCoreApp);
      }
      return;
    }

    setInstallingId(app.id);
    setTimeout(() => {
      setApps((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, installed: true } : a))
      );
      setInstallingId(null);
    }, 850);
  };

  return (
    <div className="flex flex-col h-full w-full text-white overflow-hidden">
      {/* Top Category & Search Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b border-white/12 bg-white/[0.03] shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                category === cat
                  ? 'bg-white text-slate-950 font-semibold shadow'
                  : 'bg-white/8 hover:bg-white/16 text-white/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-36 sm:w-48">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/45" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Vision apps..."
            className="w-full pl-7 pr-2.5 py-1 rounded-full text-xs vision-input text-white placeholder-white/45"
          />
        </div>
      </div>

      {/* Main Store Scroll Area */}
      <div className="flex-1 spatial-scroll p-4 space-y-4">
        {/* Hero Spotlight Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-white/25 p-5 bg-gradient-to-br from-indigo-600/80 via-violet-700/75 to-slate-950 shadow-xl">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold uppercase tracking-wider text-sky-200 mb-2">
            <Sparkles size={11} />
            <span>Featured for Apple Vision</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Designed for Infinite Spatial Canvas
          </h2>
          <p className="text-xs text-white/80 max-w-md mt-1 leading-relaxed">
            Discover volumetric apps that respond to MediaPipe hand pinch gestures, Dolby Atmos spatial audio, and live rear camera passthrough.
          </p>
        </div>

        {/* App Cards List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredApps.map((app) => {
            const isInstalling = installingId === app.id;
            return (
              <div
                key={app.id}
                className="vision-card rounded-3xl p-3.5 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${app.iconGradient} flex items-center justify-center shrink-0 border border-white/30 shadow-md`}
                  >
                    <Sparkles size={22} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/12 text-sky-300 font-medium">
                        {app.badge}
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate mt-1">
                      {app.name}
                    </h3>
                    <p className="text-[11px] text-white/70 truncate">{app.subtitle}</p>
                  </div>
                </div>

                <p className="text-[11px] text-white/75 leading-relaxed line-clamp-2">
                  {app.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2 text-[11px] text-white/70">
                    <span className="inline-flex items-center gap-0.5 text-amber-300 font-semibold">
                      <Star size={11} className="fill-amber-300" />
                      {app.rating.toFixed(1)}
                    </span>
                    <span>·</span>
                    <span>{app.size}</span>
                  </div>

                  <button
                    type="button"
                    disabled={isInstalling}
                    onClick={() => handleInstallOrOpen(app)}
                    className={`px-3.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                      app.installed
                        ? 'bg-white/20 hover:bg-white text-white hover:text-slate-950 border border-white/30'
                        : 'bg-sky-500 hover:bg-sky-400 text-white shadow'
                    }`}
                  >
                    {isInstalling ? (
                      <span>Installing...</span>
                    ) : app.installed ? (
                      <>
                        <Check size={12} />
                        <span>OPEN</span>
                      </>
                    ) : (
                      <>
                        <Download size={12} />
                        <span>GET</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
