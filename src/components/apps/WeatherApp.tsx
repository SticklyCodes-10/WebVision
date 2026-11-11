import React, { useEffect, useRef, useState } from 'react';
import {
  CloudRain,
  CloudSnow,
  Droplets,
  Moon,
  Sun,
  Wind,
} from 'lucide-react';

interface WeatherCity {
  id: string;
  name: string;
  region: string;
  temp: number;
  high: number;
  low: number;
  condition: string;
  effect: 'sun' | 'rain' | 'snow' | 'stars';
  humidity: string;
  wind: string;
  uv: string;
  hourly: { time: string; temp: number }[];
  daily: { day: string; low: number; high: number; cond: string }[];
}

const CITIES: WeatherCity[] = [
  {
    id: 'cupertino',
    name: 'Cupertino',
    region: 'California',
    temp: 72,
    high: 76,
    low: 54,
    condition: 'Golden Spatial Sun',
    effect: 'sun',
    humidity: '42%',
    wind: '8 mph NW',
    uv: '6 High',
    hourly: [
      { time: 'Now', temp: 72 },
      { time: '1PM', temp: 74 },
      { time: '2PM', temp: 76 },
      { time: '3PM', temp: 75 },
      { time: '4PM', temp: 71 },
      { time: '5PM', temp: 67 },
    ],
    daily: [
      { day: 'Today', low: 54, high: 76, cond: 'Sunny' },
      { day: 'Tue', low: 55, high: 78, cond: 'Clear' },
      { day: 'Wed', low: 52, high: 71, cond: 'Breezy' },
      { day: 'Thu', low: 53, high: 74, cond: 'Sunny' },
    ],
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    region: 'Shibuya · Japan',
    temp: 61,
    high: 64,
    low: 53,
    condition: 'Light Neon Rain',
    effect: 'rain',
    humidity: '84%',
    wind: '14 mph E',
    uv: '2 Low',
    hourly: [
      { time: 'Now', temp: 61 },
      { time: '10PM', temp: 60 },
      { time: '11PM', temp: 58 },
      { time: '12AM', temp: 57 },
      { time: '1AM', temp: 55 },
      { time: '2AM', temp: 54 },
    ],
    daily: [
      { day: 'Today', low: 53, high: 64, cond: 'Showers' },
      { day: 'Tue', low: 51, high: 66, cond: 'Cloudy' },
      { day: 'Wed', low: 54, high: 70, cond: 'Clear' },
      { day: 'Thu', low: 56, high: 72, cond: 'Sunny' },
    ],
  },
  {
    id: 'reykjavik',
    name: 'Reykjavík',
    region: 'Iceland',
    temp: 29,
    high: 33,
    low: 22,
    condition: 'Aurora Snow Drift',
    effect: 'snow',
    humidity: '78%',
    wind: '19 mph NNE',
    uv: '1 Low',
    hourly: [
      { time: 'Now', temp: 29 },
      { time: '6PM', temp: 28 },
      { time: '7PM', temp: 26 },
      { time: '8PM', temp: 25 },
      { time: '9PM', temp: 24 },
      { time: '10PM', temp: 23 },
    ],
    daily: [
      { day: 'Today', low: 22, high: 33, cond: 'Snow' },
      { day: 'Tue', low: 20, high: 31, cond: 'Flurries' },
      { day: 'Wed', low: 24, high: 35, cond: 'Crisp' },
      { day: 'Thu', low: 25, high: 36, cond: 'Aurora' },
    ],
  },
  {
    id: 'zurich',
    name: 'Zürich',
    region: 'Switzerland',
    temp: 48,
    high: 54,
    low: 41,
    condition: 'Alpine Starlight',
    effect: 'stars',
    humidity: '61%',
    wind: '6 mph SW',
    uv: '0 Low',
    hourly: [
      { time: 'Now', temp: 48 },
      { time: '9PM', temp: 46 },
      { time: '10PM', temp: 45 },
      { time: '11PM', temp: 43 },
      { time: '12AM', temp: 42 },
      { time: '1AM', temp: 41 },
    ],
    daily: [
      { day: 'Today', low: 41, high: 54, cond: 'Clear' },
      { day: 'Tue', low: 43, high: 57, cond: 'Sunny' },
      { day: 'Wed', low: 39, high: 51, cond: 'Mist' },
      { day: 'Thu', low: 40, high: 55, cond: 'Clear' },
    ],
  },
];

export const WeatherApp: React.FC = () => {
  const [selectedCityId, setSelectedCityId] = useState<string>('cupertino');
  const [useCelsius, setUseCelsius] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const city = CITIES.find((c) => c.id === selectedCityId) || CITIES[0];

  const fmtTemp = (f: number) => (useCelsius ? Math.round(((f - 32) * 5) / 9) : f);

  // Live Weather Particle Simulation Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles = Array.from({ length: 42 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speedY: city.effect === 'rain' ? 4 + Math.random() * 3 : 0.6 + Math.random() * 1.2,
      speedX: city.effect === 'snow' ? (Math.random() - 0.5) * 0.9 : 0,
      radius: city.effect === 'snow' ? 1.8 + Math.random() * 2.2 : 1.3 + Math.random() * 1.5,
      alpha: 0.35 + Math.random() * 0.65,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        if (city.effect === 'rain') {
          ctx.strokeStyle = `rgba(125, 211, 252, ${p.alpha})`;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 1.5, p.y + 10);
          ctx.stroke();
          p.y += p.speedY;
          if (p.y > canvas.height) {
            p.y = -10;
            p.x = Math.random() * canvas.width;
          }
        } else if (city.effect === 'snow') {
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          p.y += p.speedY;
          p.x += p.speedX;
          if (p.y > canvas.height) {
            p.y = -5;
            p.x = Math.random() * canvas.width;
          }
        } else if (city.effect === 'sun') {
          ctx.fillStyle = `rgba(253, 224, 71, ${p.alpha * 0.55})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 1.4, 0, Math.PI * 2);
          ctx.fill();
          p.y -= p.speedY * 0.35;
          if (p.y < 0) p.y = canvas.height;
        } else {
          // Starlight twinkle
          ctx.fillStyle = `rgba(224, 231, 255, ${Math.abs(Math.sin(performance.now() * 0.002 + p.x))})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [city.effect]);

  return (
    <div className="relative flex flex-col h-full w-full text-white overflow-hidden">
      {/* Ambient Animated Weather Particles Layer */}
      <canvas
        ref={canvasRef}
        width={560}
        height={380}
        className="pointer-events-none absolute inset-0 w-full h-full opacity-75"
      />

      {/* Top City Switcher Bar */}
      <div className="relative z-10 flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-white/12 bg-white/[0.03] shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {CITIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCityId(c.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                c.id === city.id
                  ? 'bg-white text-slate-950 font-semibold shadow'
                  : 'bg-white/10 hover:bg-white/20 text-white/80'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setUseCelsius((u) => !u)}
          className="px-2.5 py-1 rounded-full bg-white/12 hover:bg-white/22 text-xs font-mono shrink-0"
        >
          °{useCelsius ? 'C' : 'F'}
        </button>
      </div>

      {/* Main Weather Telemetry Content */}
      <div className="relative z-10 flex-1 spatial-scroll p-4 space-y-3.5">
        {/* Hero Temperature Banner */}
        <div className="vision-card rounded-3xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-sky-300 font-medium">{city.region}</div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{city.name}</h2>
            <p className="text-xs text-white/80 mt-0.5">{city.condition}</p>
            <div className="text-[11px] text-white/65 mt-1 font-mono">
              H:{fmtTemp(city.high)}° · L:{fmtTemp(city.low)}°
            </div>
          </div>

          <div className="flex items-center gap-3">
            {city.effect === 'sun' && <Sun size={40} className="text-amber-300 drop-shadow-lg" />}
            {city.effect === 'rain' && <CloudRain size={40} className="text-sky-300 drop-shadow-lg" />}
            {city.effect === 'snow' && <CloudSnow size={40} className="text-white drop-shadow-lg" />}
            {city.effect === 'stars' && <Moon size={40} className="text-indigo-200 drop-shadow-lg" />}
            <span className="text-4xl sm:text-5xl font-light tracking-tighter">
              {fmtTemp(city.temp)}°
            </span>
          </div>
        </div>

        {/* Hourly Strip */}
        <div className="vision-card rounded-2xl p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-white/65 mb-2">
            Hourly Spatial Forecast
          </div>
          <div className="grid grid-cols-6 gap-2 text-center">
            {city.hourly.map((h) => (
              <div key={h.time} className="rounded-xl bg-white/[0.05] py-2 px-1">
                <div className="text-[10px] text-white/65">{h.time}</div>
                <div className="text-xs sm:text-sm font-bold text-white mt-1">
                  {fmtTemp(h.temp)}°
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4-Day Outlook & Atmosphere Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="vision-card rounded-2xl p-3 space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/65 mb-1">
              Multi-Day Outlook
            </div>
            {city.daily.map((d) => (
              <div
                key={d.day}
                className="flex items-center justify-between text-xs py-1 border-b border-white/8 last:border-none"
              >
                <span className="font-medium w-14">{d.day}</span>
                <span className="text-sky-300 text-[11px]">{d.cond}</span>
                <span className="font-mono text-[11px] text-white/80">
                  {fmtTemp(d.low)}° / {fmtTemp(d.high)}°
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="vision-card rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center gap-1 text-[11px] text-sky-300">
                <Wind size={12} />
                <span>Wind Vector</span>
              </div>
              <div className="text-sm font-bold text-white mt-1">{city.wind}</div>
            </div>

            <div className="vision-card rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center gap-1 text-[11px] text-emerald-300">
                <Droplets size={12} />
                <span>Humidity</span>
              </div>
              <div className="text-sm font-bold text-white mt-1">{city.humidity}</div>
            </div>

            <div className="vision-card rounded-2xl p-3 col-span-2 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-amber-300">Ultraviolet Index</div>
                <div className="text-xs font-bold text-white">{city.uv}</div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 text-white/75">
                Spatial Sky Sensor Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
