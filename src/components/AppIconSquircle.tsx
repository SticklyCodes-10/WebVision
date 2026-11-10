import React from 'react';
import {
  Calendar,
  CloudSun,
  Compass,
  FileText,
  Image as ImageIcon,
  MessageCircle,
  Music,
  Settings,
  ShoppingBag,
} from 'lucide-react';
import { AppId } from '../types/vision';

interface AppIconSquircleProps {
  appId: AppId;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'squircle' | 'circle';
  className?: string;
}

export const AppIconSquircle: React.FC<AppIconSquircleProps> = ({
  appId,
  size = 'md',
  shape = 'squircle',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-9 h-9 text-white',
    md: 'w-12 h-12 sm:w-13 sm:h-13 text-white',
    lg: 'w-15 h-15 sm:w-16 sm:h-16 text-white',
    xl: 'w-18 h-18 sm:w-20 sm:h-20 text-white',
  }[size];

  const iconSizes = {
    sm: 18,
    md: 24,
    lg: 30,
    xl: 36,
  }[size];

  const radiusClass = shape === 'circle' ? 'rounded-full' : 'rounded-[26%]';

  const config: Record<
    AppId,
    {
      bg: string;
      icon: React.ReactNode;
      glow: string;
    }
  > = {
    safari: {
      bg: 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600',
      icon: <Compass size={iconSizes} strokeWidth={2.1} className="drop-shadow-md" />,
      glow: 'shadow-blue-500/40',
    },
    photos: {
      bg: 'bg-gradient-to-tr from-rose-500 via-amber-400 to-teal-400',
      icon: <ImageIcon size={iconSizes} strokeWidth={2.1} className="drop-shadow-md" />,
      glow: 'shadow-rose-500/40',
    },
    music: {
      bg: 'bg-gradient-to-br from-pink-500 via-rose-500 to-red-600',
      icon: <Music size={iconSizes} strokeWidth={2.2} className="drop-shadow-md" />,
      glow: 'shadow-rose-500/40',
    },
    messages: {
      bg: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600',
      icon: <MessageCircle size={iconSizes} strokeWidth={2.2} className="fill-white/25 drop-shadow-md" />,
      glow: 'shadow-emerald-500/40',
    },
    notes: {
      bg: 'bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500',
      icon: <FileText size={iconSizes} strokeWidth={2.1} className="text-slate-900 drop-shadow-sm" />,
      glow: 'shadow-amber-400/40',
    },
    calendar: {
      bg: 'bg-gradient-to-b from-red-500 via-rose-500 to-zinc-800',
      icon: <Calendar size={iconSizes} strokeWidth={2.1} className="drop-shadow-md" />,
      glow: 'shadow-red-500/40',
    },
    weather: {
      bg: 'bg-gradient-to-br from-sky-300 via-blue-500 to-indigo-700',
      icon: <CloudSun size={iconSizes} strokeWidth={2.1} className="drop-shadow-md" />,
      glow: 'shadow-sky-400/40',
    },
    appstore: {
      bg: 'bg-gradient-to-br from-blue-400 via-indigo-500 to-violet-600',
      icon: <ShoppingBag size={iconSizes} strokeWidth={2.1} className="drop-shadow-md" />,
      glow: 'shadow-indigo-500/40',
    },
    settings: {
      bg: 'bg-gradient-to-br from-slate-400 via-zinc-600 to-slate-800',
      icon: <Settings size={iconSizes} strokeWidth={2.1} className="drop-shadow-md" />,
      glow: 'shadow-slate-500/40',
    },
  };

  const item = config[appId];

  return (
    <div
      className={`relative flex items-center justify-center ${sizeClasses} ${radiusClass} ${item.bg} shadow-lg ${item.glow} border border-white/35 overflow-hidden transition-transform duration-200 ${className}`}
      style={{
        boxShadow:
          '0 10px 24px -6px rgba(0,0,0,0.48), inset 0 1.5px 2px rgba(255,255,255,0.65), inset 0 -2px 4px rgba(0,0,0,0.28)',
      }}
    >
      {/* Top glossy lens sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent" />
      <div className="relative z-10 flex items-center justify-center">{item.icon}</div>
    </div>
  );
};
