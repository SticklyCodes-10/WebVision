import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Compass,
  ExternalLink,
  Globe,
  Lock,
  Plus,
  RotateCw,
  Search,
  Sparkles,
  Star,
  X,
} from 'lucide-react';

interface BrowserTab {
  id: string;
  title: string;
  url: string;
  pageType: 'apple-vision' | 'jwst-space' | 'arch-digest' | 'spatial-canvas' | 'search';
  searchQuery?: string;
}

const BOOKMARKS: { title: string; url: string; pageType: BrowserTab['pageType']; badge: string }[] = [
  {
    title: 'Apple Vision Pro',
    url: 'https://apple.com/apple-vision-pro',
    pageType: 'apple-vision',
    badge: 'Spatial OS',
  },
  {
    title: 'NASA Webb 3D Cosmos',
    url: 'https://webb.nasa.gov/spatial-observatory',
    pageType: 'jwst-space',
    badge: 'Deep Space',
  },
  {
    title: 'Interactive 3D Orb',
    url: 'https://spatial.playground/3d-particles',
    pageType: 'spatial-canvas',
    badge: 'WebGL Toy',
  },
  {
    title: 'Spatial Architecture',
    url: 'https://archdigest.spatial/glass-pavilions',
    pageType: 'arch-digest',
    badge: 'Editorial',
  },
];

export const SafariApp: React.FC = () => {
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: 'tab-1',
      title: 'Apple Vision Pro — Spatial Computing',
      url: 'https://apple.com/apple-vision-pro',
      pageType: 'apple-vision',
    },
    {
      id: 'tab-2',
      title: 'Interactive 3D Spatial Orb',
      url: 'https://spatial.playground/3d-particles',
      pageType: 'spatial-canvas',
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [addressInput, setAddressInput] = useState<string>('https://apple.com/apple-vision-pro');
  const [readerMode, setReaderMode] = useState<boolean>(false);
  const [historyStack, setHistoryStack] = useState<BrowserTab['pageType'][]>(['apple-vision']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Interactive 3D Particle Sphere Canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [orbSpeed, setOrbSpeed] = useState<number>(1.2);
  const [orbColor, setOrbColor] = useState<string>('#38BDF8');

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    if (activeTab) {
      setAddressInput(activeTab.url);
    }
  }, [activeTab]);

  // Animate 3D Spatial Particle Sphere when on 'spatial-canvas' page
  useEffect(() => {
    if (activeTab?.pageType !== 'spatial-canvas') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angleY = 0;
    let angleX = 0.25;

    const points: { x: number; y: number; z: number }[] = [];
    const count = 160;
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      points.push({
        x: Math.cos(theta) * Math.sin(phi),
        y: Math.sin(theta) * Math.sin(phi),
        z: Math.cos(phi),
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(cx, cy) * 0.68;

      angleY += 0.012 * orbSpeed;
      angleX += 0.005 * orbSpeed;

      points.forEach((p) => {
        // Rotate Y
        const x1 = p.x * Math.cos(angleY) - p.z * Math.sin(angleY);
        const z1 = p.z * Math.cos(angleY) + p.x * Math.sin(angleY);
        // Rotate X
        const y2 = p.y * Math.cos(angleX) - z1 * Math.sin(angleX);
        const z2 = z1 * Math.cos(angleX) + p.y * Math.sin(angleX);

        const scale = 2.4 / (2.4 - z2 * 0.8);
        const px = cx + x1 * radius * scale;
        const py = cy + y2 * radius * scale;
        const size = Math.max(1.2, (z2 + 1.4) * 2.1);

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = orbColor;
        ctx.globalAlpha = Math.max(0.2, Math.min(1, (z2 + 1.2) / 2.1));
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeTab?.pageType, orbSpeed, orbColor]);

  const navigateToPage = (
    pageType: BrowserTab['pageType'],
    url: string,
    title: string,
    searchQuery?: string
  ) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTab.id ? { ...t, pageType, url, title, searchQuery } : t
      )
    );
    setAddressInput(url);
    const nextStack = historyStack.slice(0, historyIndex + 1);
    nextStack.push(pageType);
    setHistoryStack(nextStack);
    setHistoryIndex(nextStack.length - 1);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = addressInput.trim();
    if (!q) return;

    const lower = q.toLowerCase();
    if (lower.includes('apple') || lower.includes('vision')) {
      navigateToPage('apple-vision', 'https://apple.com/apple-vision-pro', 'Apple Vision Pro');
    } else if (lower.includes('nasa') || lower.includes('webb') || lower.includes('space')) {
      navigateToPage('jwst-space', 'https://webb.nasa.gov/spatial-observatory', 'NASA Webb 3D Cosmos');
    } else if (lower.includes('3d') || lower.includes('orb') || lower.includes('particle')) {
      navigateToPage('spatial-canvas', 'https://spatial.playground/3d-particles', 'Interactive 3D Orb');
    } else if (lower.includes('arch') || lower.includes('glass')) {
      navigateToPage('arch-digest', 'https://archdigest.spatial/glass-pavilions', 'Spatial Architecture');
    } else {
      navigateToPage(
        'search',
        `https://spatial.search/?q=${encodeURIComponent(q)}`,
        `Search: ${q}`,
        q
      );
    }
  };

  const addNewTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab: BrowserTab = {
      id: newId,
      title: 'NASA Webb 3D Cosmos',
      url: 'https://webb.nasa.gov/spatial-observatory',
      pageType: 'jwst-space',
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length <= 1) return;
    const filtered = tabs.filter((t) => t.id !== id);
    setTabs(filtered);
    if (activeTabId === id) {
      setActiveTabId(filtered[0].id);
    }
  };

  return (
    <div className="flex flex-col h-full w-full text-white">
      {/* Top Safari Spatial URL & Navigation Pill Bar */}
      <div className="px-3 pt-2.5 pb-2 border-b border-white/12 bg-white/[0.03] space-y-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={historyIndex <= 0}
              onClick={() => {
                if (historyIndex > 0) {
                  const prevType = historyStack[historyIndex - 1];
                  setHistoryIndex(historyIndex - 1);
                  const bm = BOOKMARKS.find((b) => b.pageType === prevType);
                  if (bm) navigateToPage(bm.pageType, bm.url, bm.title);
                }
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 disabled:opacity-35 transition-all"
              title="Back"
            >
              <ArrowLeft size={13} />
            </button>
            <button
              type="button"
              disabled={historyIndex >= historyStack.length - 1}
              onClick={() => {
                if (historyIndex < historyStack.length - 1) {
                  const nextType = historyStack[historyIndex + 1];
                  setHistoryIndex(historyIndex + 1);
                  const bm = BOOKMARKS.find((b) => b.pageType === nextType);
                  if (bm) navigateToPage(bm.pageType, bm.url, bm.title);
                }
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 disabled:opacity-35 transition-all"
              title="Forward"
            >
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Spatial URL / Search Pill */}
          <form onSubmit={handleAddressSubmit} className="flex-1 flex items-center">
            <div className="relative w-full flex items-center">
              <Lock size={12} className="absolute left-3 text-emerald-300 pointer-events-none" />
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="Search or enter spatial website name"
                className="w-full pl-8 pr-16 py-1.5 rounded-full text-xs vision-input text-white placeholder-white/50"
              />
              <button
                type="button"
                onClick={() => setReaderMode((r) => !r)}
                title="Toggle Spatial Reader Mode"
                className={`absolute right-7 p-1 rounded-full transition-colors ${
                  readerMode ? 'text-sky-300 bg-sky-500/25' : 'text-white/60 hover:text-white'
                }`}
              >
                <BookOpen size={12} />
              </button>
              <button
                type="submit"
                title="Reload / Go"
                className="absolute right-2 p-1 text-white/65 hover:text-white"
              >
                <RotateCw size={12} />
              </button>
            </div>
          </form>

          <button
            type="button"
            onClick={addNewTab}
            title="New Spatial Tab"
            className="w-7 h-7 rounded-full flex items-center justify-center bg-white/12 hover:bg-white/25 transition-all shrink-0"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Spatial Tabs & Quick Bookmarks Strip */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] cursor-pointer transition-all border ${
                  tab.id === activeTab.id
                    ? 'bg-white/24 border-white/40 text-white font-medium shadow-sm'
                    : 'bg-white/8 border-white/10 text-white/70 hover:bg-white/15'
                }`}
              >
                <Globe size={11} className="text-sky-300 shrink-0" />
                <span className="truncate max-w-[110px]">{tab.title}</span>
                {tabs.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => closeTab(tab.id, e)}
                    className="opacity-65 hover:opacity-100 ml-0.5"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Quick Spatial Bookmarks */}
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            {BOOKMARKS.map((bm) => (
              <button
                key={bm.title}
                type="button"
                onClick={() => navigateToPage(bm.pageType, bm.url, bm.title)}
                className={`px-2 py-0.5 rounded-full text-[10px] transition-all border ${
                  activeTab.pageType === bm.pageType
                    ? 'bg-sky-500/30 border-sky-400/50 text-sky-200'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/15'
                }`}
              >
                {bm.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Spatial Web Page Viewport */}
      <div className={`flex-1 spatial-scroll p-4 sm:p-5 ${readerMode ? 'bg-slate-950/65 font-serif' : ''}`}>
        {/* Mobile Bookmark Chips */}
        <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-white/10">
          {BOOKMARKS.map((bm) => (
            <button
              key={bm.title}
              type="button"
              onClick={() => navigateToPage(bm.pageType, bm.url, bm.title)}
              className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap border ${
                activeTab.pageType === bm.pageType
                  ? 'bg-sky-500/30 border-sky-400/50 text-white font-medium'
                  : 'bg-white/8 border-white/10 text-white/75'
              }`}
            >
              {bm.title}
            </button>
          ))}
        </div>

        {activeTab.pageType === 'apple-vision' && (
          <div className="space-y-4">
            <div className="relative rounded-3xl overflow-hidden border border-white/20 p-5 sm:p-6 bg-gradient-to-br from-slate-900/90 via-indigo-950/75 to-slate-950/90 shadow-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-medium text-sky-300 mb-2">
                <Sparkles size={12} />
                <span>visionOS 2.0 Spatial Web</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
                Welcome to the Era of Spatial Computing.
              </h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-4">
                Seamlessly blend digital content with your physical space using your smartphone’s rear camera passthrough and real-time MediaPipe 21-keypoint hand tracking.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    navigateToPage(
                      'spatial-canvas',
                      'https://spatial.playground/3d-particles',
                      'Interactive 3D Orb'
                    )
                  }
                  className="px-3.5 py-1.5 rounded-full bg-white text-slate-950 font-semibold text-xs hover:bg-white/90 transition-all"
                >
                  Launch 3D WebGL Orb
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigateToPage(
                      'jwst-space',
                      'https://webb.nasa.gov/spatial-observatory',
                      'NASA Webb 3D Cosmos'
                    )
                  }
                  className="px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-medium text-xs border border-white/20 transition-all"
                >
                  Explore Deep Space
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="vision-card rounded-2xl p-3.5">
                <div className="text-xs font-semibold text-sky-300 mb-1">Optical Passthrough</div>
                <p className="text-[11px] text-white/75 leading-relaxed">
                  Uses <code className="text-white/95">facingMode: &quot;environment&quot;</code> to stream your live rear camera directly behind translucent windows.
                </p>
              </div>
              <div className="vision-card rounded-2xl p-3.5">
                <div className="text-xs font-semibold text-emerald-300 mb-1">Natural Hand Input</div>
                <p className="text-[11px] text-white/75 leading-relaxed">
                  Pinch thumb and index finger to click buttons or drag floating windows anywhere in space.
                </p>
              </div>
              <div className="vision-card rounded-2xl p-3.5">
                <div className="text-xs font-semibold text-violet-300 mb-1">Stereoscopic VR</div>
                <p className="text-[11px] text-white/75 leading-relaxed">
                  Switch to dual-eye Side-by-Side VR Headset view with customizable IPD calibration.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab.pageType === 'jwst-space' && (
          <div className="space-y-4">
            <div className="relative rounded-3xl overflow-hidden border border-white/25 h-48 sm:h-56">
              <img
                src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1400&q=80"
                alt="Carina Nebula Deep Field"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent p-5 flex flex-col justify-end">
                <span className="text-[10px] uppercase tracking-widest text-amber-300 font-semibold">
                  James Webb Space Telescope · NIRCam
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Cosmic Cliffs of the Carina Nebula (NGC 3324)
                </h2>
                <p className="text-xs text-white/80">
                  7,600 light-years away · Infrared spatial telemetry
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="vision-card rounded-2xl p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mb-1">
                  <Star size={13} />
                  <span>Protostellar Jets</span>
                </div>
                <p className="text-[11px] text-white/75 leading-relaxed">
                  Ionized gas and hot dust streaming from newborn stars previously hidden in visible wavelengths.
                </p>
              </div>
              <div className="vision-card rounded-2xl p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-300 mb-1">
                  <Compass size={13} />
                  <span>L2 Lagrange Orbit</span>
                </div>
                <p className="text-[11px] text-white/75 leading-relaxed">
                  Operating at −223°C 1.5 million kilometers from Earth with a 6.5-meter gold-coated beryllium mirror.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab.pageType === 'spatial-canvas' && (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-full flex flex-wrap items-center justify-between gap-2 vision-card rounded-2xl px-3.5 py-2">
              <div>
                <div className="text-xs font-semibold text-white">Interactive 3D Spatial Particle Sphere</div>
                <div className="text-[11px] text-white/65">Real-time 3D Fibonacci Lattice projection</div>
              </div>
              <div className="flex items-center gap-2">
                {['#38BDF8', '#34D399', '#F472B6', '#FBBF24'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setOrbColor(c)}
                    className={`w-5 h-5 rounded-full border ${
                      orbColor === c ? 'border-white scale-110' : 'border-white/30'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="range"
                  min={0.2}
                  max={3.5}
                  step={0.1}
                  value={orbSpeed}
                  onChange={(e) => setOrbSpeed(Number(e.target.value))}
                  className="w-20 accent-sky-400"
                  title="Rotation Speed"
                />
              </div>
            </div>

            <div className="w-full h-56 rounded-3xl bg-slate-950/60 border border-white/15 flex items-center justify-center overflow-hidden">
              <canvas ref={canvasRef} width={380} height={220} className="w-full h-full" />
            </div>
          </div>
        )}

        {activeTab.pageType === 'arch-digest' && (
          <div className="space-y-4">
            <div className="rounded-3xl overflow-hidden border border-white/20">
              <img
                src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
                alt="Glass Pavilion Architecture"
                className="w-full h-44 object-cover"
              />
              <div className="p-4 bg-white/[0.04]">
                <span className="text-[10px] uppercase tracking-wider text-sky-300 font-semibold">
                  Spatial Architecture Digest
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                  Designing with Light: How Curved Structural Glass Inspired visionOS
                </h3>
                <p className="text-xs text-white/75 mt-1.5 leading-relaxed">
                  From Apple Park’s cantilevered glass canopies to acoustic frosted platters that absorb ambient room hues, modern spatial interfaces borrow directly from physical architecture.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab.pageType === 'search' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-white/75">
              <Search size={14} className="text-sky-300" />
              <span>
                Spatial Search Results for <strong className="text-white">&ldquo;{activeTab.searchQuery}&rdquo;</strong>
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="vision-card rounded-2xl p-3.5">
                <div className="text-xs text-sky-300 font-medium flex items-center gap-1">
                  <span>en.wikipedia.org/wiki/{encodeURIComponent(activeTab.searchQuery || '')}</span>
                  <ExternalLink size={11} />
                </div>
                <h4 className="text-sm font-semibold text-white mt-0.5">
                  {activeTab.searchQuery} — Spatial Knowledge Encyclopedia
                </h4>
                <p className="text-xs text-white/75 mt-1 leading-relaxed">
                  Interactive spatial overview and 3D reference data for &ldquo;{activeTab.searchQuery}&rdquo;. Click any bookmark tab above to switch between curated spatial web experiences.
                </p>
              </div>

              <div className="vision-card rounded-2xl p-3.5">
                <h4 className="text-sm font-semibold text-white">
                  Explore Quick Spatial Destinations
                </h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {BOOKMARKS.map((bm) => (
                    <button
                      key={bm.title}
                      type="button"
                      onClick={() => navigateToPage(bm.pageType, bm.url, bm.title)}
                      className="px-3 py-1 rounded-full bg-white/12 hover:bg-white/25 text-xs text-white transition-all"
                    >
                      {bm.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
