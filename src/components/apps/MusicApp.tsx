import React, { useEffect, useState } from 'react';
import {
  Disc3,
  Headphones,
  ListMusic,
  Mic2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react';
import { INITIAL_TRACKS } from '../../data/initialData';
import { MusicTrack } from '../../types/vision';
import { spatialAudio } from '../../utils/soundEffects';

export const MusicApp: React.FC = () => {
  const [tracks] = useState<MusicTrack[]>(INITIAL_TRACKS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(28);
  const [volume, setVolume] = useState<number>(0.72);
  const [spatialOrbit, setSpatialOrbit] = useState<boolean>(true);
  const [showLyrics, setShowLyrics] = useState<boolean>(false);
  const [freqBars, setFreqBars] = useState<number[]>([18, 34, 24, 48, 32, 22, 40, 26, 16, 30]);

  const currentTrack = tracks[currentIndex] || tracks[0];

  // Control real Web Audio API synthesizer when playing changes
  useEffect(() => {
    if (isPlaying) {
      spatialAudio.startMusicTrack(currentTrack.chordNotes, currentTrack.bpm, spatialOrbit);
    } else {
      spatialAudio.stopMusicTrack();
    }
    return () => {
      spatialAudio.stopMusicTrack();
    };
  }, [isPlaying, currentTrack, spatialOrbit]);

  // Progress timer & visualizer bar animation
  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= currentTrack.duration) {
          setCurrentIndex((idx) => (idx + 1) % tracks.length);
          return 0;
        }
        return prev + 1;
      });

      const freqData = spatialAudio.getFrequencyData();
      const bars = Array.from({ length: 10 }, (_, i) => {
        const val = freqData[i % freqData.length] || 20;
        return Math.max(12, Math.min(100, Math.round((val / 255) * 100 + Math.random() * 26)));
      });
      setFreqBars(bars);
    }, 350);

    return () => clearInterval(timer);
  }, [isPlaying, currentTrack.duration, tracks.length]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    spatialAudio.setMusicVolume(val);
  };

  const handlePrev = () => {
    setElapsed(0);
    setCurrentIndex((idx) => (idx - 1 + tracks.length) % tracks.length);
  };

  const handleNext = () => {
    setElapsed(0);
    setCurrentIndex((idx) => (idx + 1) % tracks.length);
  };

  return (
    <div className="flex flex-col h-full w-full text-white p-3.5 sm:p-4 overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col sm:flex-row gap-4 overflow-hidden">
        {/* Left: Now Playing Spatial Album Platter */}
        <div className="sm:w-56 flex flex-col justify-between vision-card rounded-3xl p-4 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-semibold text-pink-200 border border-white/15">
              <Headphones size={11} />
              <span>{currentTrack.spatialMode}</span>
            </span>

            <button
              type="button"
              onClick={() => setSpatialOrbit((s) => !s)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                spatialOrbit
                  ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
                  : 'bg-white/10 border-white/15 text-white/65'
              }`}
              title="Toggle 3D Stereo Binaural Head-Tracked Orbit"
            >
              {spatialOrbit ? '3D Orbit On' : 'Stereo Fixed'}
            </button>
          </div>

          {/* 3D Album Artwork with Live Frequency Visualizer */}
          <div
            className={`relative w-full h-32 sm:h-36 rounded-2xl bg-gradient-to-br ${currentTrack.coverGradient} shadow-xl border border-white/30 flex flex-col items-center justify-center overflow-hidden my-1`}
          >
            <Disc3
              size={48}
              className={`text-white/90 drop-shadow-lg transition-transform duration-700 ${
                isPlaying ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '7s' }}
            />

            {/* Live Spatial Audio Frequency Visualizer */}
            <div className="absolute bottom-2 inset-x-4 h-7 flex items-end justify-center gap-1">
              {freqBars.map((heightPct, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-white/85 transition-all duration-200"
                  style={{ height: `${isPlaying ? heightPct : 16}%` }}
                />
              ))}
            </div>
          </div>

          {/* Track Title & Artist */}
          <div className="mt-2">
            <h3 className="text-sm font-bold text-white truncate">{currentTrack.title}</h3>
            <p className="text-xs text-white/70 truncate">
              {currentTrack.artist} · {currentTrack.album}
            </p>
          </div>

          {/* Scrubbable Timeline */}
          <div className="mt-2">
            <input
              type="range"
              min={0}
              max={currentTrack.duration}
              value={elapsed}
              onChange={(e) => setElapsed(Number(e.target.value))}
              className="w-full accent-pink-400 cursor-pointer h-1"
            />
            <div className="flex justify-between text-[10px] font-mono text-white/65 mt-0.5">
              <span>{formatTime(elapsed)}</span>
              <span>-{formatTime(Math.max(0, currentTrack.duration - elapsed))}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-between mt-2">
            <button
              type="button"
              onClick={() => setShowLyrics((v) => !v)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                showLyrics ? 'bg-pink-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white/80'
              }`}
              title="Toggle Spatial Lyrics"
            >
              <Mic2 size={13} />
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handlePrev}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                <SkipBack size={14} />
              </button>
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-slate-950 hover:scale-105 active:scale-95 shadow-lg transition-all"
              >
                {isPlaying ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                <SkipForward size={14} />
              </button>
            </div>

            <div className="flex items-center gap-1 w-16">
              <Volume2 size={12} className="text-white/70 shrink-0" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full accent-white cursor-pointer h-1"
              />
            </div>
          </div>
        </div>

        {/* Right: Spatial Queue or Synchronized Spatial Lyrics */}
        <div className="flex-1 flex flex-col min-h-0 vision-card rounded-3xl p-3.5 overflow-hidden">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
              {showLyrics ? <Mic2 size={14} className="text-pink-400" /> : <ListMusic size={14} className="text-pink-400" />}
              <span>{showLyrics ? 'Spatial Synchronized Lyrics' : 'Dolby Atmos Spatial Queue'}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowLyrics((v) => !v)}
              className="text-[11px] text-pink-300 hover:text-pink-200 font-medium"
            >
              {showLyrics ? 'Show Queue' : 'Show Lyrics'}
            </button>
          </div>

          {showLyrics ? (
            <div className="flex-1 spatial-scroll flex flex-col justify-center space-y-3 px-2">
              {currentTrack.lyrics.map((line, idx) => {
                const activeLine = Math.floor((elapsed / 8) % currentTrack.lyrics.length) === idx;
                return (
                  <p
                    key={idx}
                    className={`transition-all duration-300 ${
                      activeLine
                        ? 'text-base sm:text-lg font-bold text-white scale-[1.02]'
                        : 'text-xs sm:text-sm font-medium text-white/45'
                    }`}
                  >
                    {line}
                  </p>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 spatial-scroll space-y-1.5 pr-1">
              {tracks.map((track, idx) => {
                const active = idx === currentIndex;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setElapsed(0);
                      setIsPlaying(true);
                    }}
                    className={`w-full flex items-center justify-between gap-2.5 p-2.5 rounded-2xl text-left transition-all border ${
                      active
                        ? 'bg-white/20 border-white/35 shadow-md'
                        : 'bg-white/[0.04] hover:bg-white/12 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${track.coverGradient} flex items-center justify-center shrink-0 border border-white/25`}
                      >
                        {active && isPlaying ? (
                          <Pause size={14} className="text-white" />
                        ) : (
                          <Play size={14} className="text-white ml-0.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{track.title}</div>
                        <div className="text-[11px] text-white/65 truncate">
                          {track.artist} · {track.spatialMode}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-white/60 shrink-0">
                      {formatTime(track.duration)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
