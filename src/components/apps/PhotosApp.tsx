import React, { useState } from 'react';
import {
  Camera,
  Expand,
  Heart,
  Layers,
  MapPin,
  Sparkles,
  X,
} from 'lucide-react';
import { INITIAL_PHOTOS } from '../../data/initialData';
import { SpatialPhoto } from '../../types/vision';

interface PhotosAppProps {
  cameraActive: boolean;
  onCaptureFrame: () => string | null;
  onRequestCamera: () => void;
}

export const PhotosApp: React.FC<PhotosAppProps> = ({
  cameraActive,
  onCaptureFrame,
  onRequestCamera,
}) => {
  const [photos, setPhotos] = useState<SpatialPhoto[]>(INITIAL_PHOTOS);
  const [filter, setFilter] = useState<'all' | 'spatial' | 'panorama' | 'favorites'>('all');
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>(INITIAL_PHOTOS[0].id);
  const [immersivePanorama, setImmersivePanorama] = useState<SpatialPhoto | null>(null);
  const [parallax, setParallax] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [captureFlash, setCaptureFlash] = useState(false);

  const filteredPhotos = photos.filter((p) => {
    if (filter === 'spatial') return p.category === 'spatial' || p.category === 'captured';
    if (filter === 'panorama') return p.category === 'panorama';
    if (filter === 'favorites') return p.isFavorite;
    return true;
  });

  const activePhoto =
    photos.find((p) => p.id === selectedPhotoId) || filteredPhotos[0] || photos[0];

  const toggleFavorite = (id: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p))
    );
  };

  const handleCaptureLiveSpatialPhoto = () => {
    if (!cameraActive) {
      onRequestCamera();
      return;
    }
    const dataUrl = onCaptureFrame();
    if (!dataUrl) return;

    setCaptureFlash(true);
    setTimeout(() => setCaptureFlash(false), 260);

    const newPhoto: SpatialPhoto = {
      id: `cap-${Date.now()}`,
      title: `Spatial Camera Capture #${photos.length + 1}`,
      location: 'Live Optical Passthrough',
      date: 'Just now · Spatial Capture',
      url: dataUrl,
      category: 'captured',
      isFavorite: true,
      depthLayers: {
        foregroundCaption: 'Captured from Live Camera Stream',
        focalLength: 'Rear Environment Lens',
        aperture: 'Spatial Web Frame',
      },
    };

    setPhotos((prev) => [newPhoto, ...prev]);
    setSelectedPhotoId(newPhoto.id);
  };

  return (
    <div className="relative flex flex-col h-full w-full text-white overflow-hidden">
      {/* Camera Shutter Flash Effect */}
      {captureFlash && (
        <div className="pointer-events-none absolute inset-0 z-50 bg-white/80 transition-opacity duration-200" />
      )}

      {/* Top Filter Pills + Live Spatial Camera Capture Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b border-white/12 bg-white/[0.03] shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Library' },
            { id: 'spatial', label: 'Spatial 3D' },
            { id: 'panorama', label: 'Panoramas' },
            { id: 'favorites', label: 'Favorites' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as typeof filter)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                filter === tab.id
                  ? 'bg-white text-slate-950 shadow'
                  : 'bg-white/8 hover:bg-white/16 text-white/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleCaptureLiveSpatialPhoto}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white shadow-md transition-all active:scale-95"
          title="Capture a Spatial Photo from the Live Rear Camera Feed"
        >
          <Camera size={13} />
          <span>{cameraActive ? 'Capture Spatial Photo' : 'Enable Cam to Capture'}</span>
        </button>
      </div>

      {/* Main Split Content: Featured Spatial Depth Stage + Thumbnail Grid */}
      <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden">
        {/* Featured Spatial 3D Photo Stage */}
        {activePhoto && (
          <div className="flex-1 p-3 sm:p-4 flex flex-col min-h-0">
            <div
              onPointerMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const nx = (e.clientX - rect.left) / rect.width - 0.5;
                const ny = (e.clientY - rect.top) / rect.height - 0.5;
                setParallax({ x: nx * 16, y: ny * 16 });
              }}
              onPointerLeave={() => setParallax({ x: 0, y: 0 })}
              className="relative flex-1 min-h-[175px] rounded-3xl overflow-hidden border border-white/25 shadow-2xl group bg-slate-950"
            >
              <img
                src={activePhoto.url}
                alt={activePhoto.title}
                className="w-full h-full object-cover transition-transform duration-150"
                style={{
                  transform: `scale(1.07) translate(${-parallax.x}px, ${-parallax.y}px)`,
                }}
              />

              {/* Top Floating Spatial Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/25 text-[11px] font-medium text-white">
                <Sparkles size={12} className="text-amber-300" />
                <span>
                  {activePhoto.category === 'panorama'
                    ? '180° Immersive Panorama'
                    : activePhoto.category === 'captured'
                    ? 'Live Camera Spatial Capture'
                    : 'Spatial 3D Depth'}
                </span>
              </div>

              {/* Top Right Actions: Favorite + Immersive Panorama Expand */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleFavorite(activePhoto.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                    activePhoto.isFavorite
                      ? 'bg-rose-500/85 border-rose-300 text-white'
                      : 'bg-slate-950/60 border-white/25 text-white/80 hover:text-white'
                  }`}
                  title="Favorite Memory"
                >
                  <Heart size={14} className={activePhoto.isFavorite ? 'fill-white' : ''} />
                </button>

                <button
                  type="button"
                  onClick={() => setImmersivePanorama(activePhoto)}
                  className="px-2.5 h-8 rounded-full flex items-center gap-1 bg-slate-950/70 hover:bg-white hover:text-slate-950 backdrop-blur-md border border-white/25 text-xs font-medium transition-all"
                  title="Open 180° Immersive Spatial View"
                >
                  <Expand size={13} />
                  <span className="hidden md:inline">Immerse</span>
                </button>
              </div>

              {/* Bottom Floating Spatial Metadata Overlay */}
              <div
                className="absolute bottom-3 inset-x-3 rounded-2xl bg-slate-950/70 backdrop-blur-md border border-white/20 p-3 flex items-center justify-between gap-2 transition-transform duration-150"
                style={{
                  transform: `translate(${parallax.x * 0.4}px, ${parallax.y * 0.4}px)`,
                }}
              >
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold text-white truncate">
                    {activePhoto.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-white/70 truncate">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={11} className="text-rose-300" />
                      {activePhoto.location}
                    </span>
                    <span>·</span>
                    <span>{activePhoto.date}</span>
                  </div>
                </div>
                {activePhoto.depthLayers && (
                  <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 text-[10px] text-sky-200 shrink-0">
                    <Layers size={11} />
                    <span>{activePhoto.depthLayers.focalLength}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right / Bottom Thumbnail Strip */}
        <div className="sm:w-44 border-t sm:border-t-0 sm:border-l border-white/12 p-2.5 spatial-scroll flex sm:flex-col gap-2 shrink-0">
          {filteredPhotos.map((photo) => {
            const isSelected = photo.id === activePhoto?.id;
            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => setSelectedPhotoId(photo.id)}
                className={`relative rounded-2xl overflow-hidden border text-left shrink-0 w-28 sm:w-full h-18 sm:h-20 transition-all ${
                  isSelected
                    ? 'border-white ring-2 ring-sky-400/70 scale-[1.02]'
                    : 'border-white/15 opacity-75 hover:opacity-100'
                }`}
              >
                <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent p-1.5 flex flex-col justify-end">
                  <span className="text-[10px] font-medium text-white truncate">{photo.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Immersive 180° Panorama Wrap Modal */}
      {immersivePanorama && (
        <div className="absolute inset-0 z-40 bg-slate-950/92 backdrop-blur-2xl flex flex-col p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-sky-300 font-semibold">
                180° Curved Panorama Immersion
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {immersivePanorama.title} — {immersivePanorama.location}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setImmersivePanorama(null)}
              className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-semibold flex items-center gap-1"
            >
              <X size={14} />
              <span>Exit Immersion</span>
            </button>
          </div>

          <div className="flex-1 rounded-3xl overflow-x-auto overflow-y-hidden border border-white/30 relative shadow-2xl">
            <img
              src={immersivePanorama.url}
              alt={immersivePanorama.title}
              className="h-full min-w-[165%] object-cover"
            />
          </div>
          <p className="text-[11px] text-white/65 text-center mt-2">
            Swipe or drag horizontally to pan across the full wraparound spatial horizon
          </p>
        </div>
      )}
    </div>
  );
};
