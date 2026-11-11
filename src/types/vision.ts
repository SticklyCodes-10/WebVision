export type AppId =
  | 'safari'
  | 'photos'
  | 'music'
  | 'settings'
  | 'messages'
  | 'notes'
  | 'calendar'
  | 'weather'
  | 'appstore';

export type HandGestureType =
  | 'none'
  | 'pointing'
  | 'pinch'
  | 'open_palm'
  | 'closed_fist'
  | 'two_fingers';

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandTelemetry {
  detected: boolean;
  gesture: HandGestureType;
  confidence: number;
  cursorX: number; // 0 to window.innerWidth
  cursorY: number; // 0 to window.innerHeight
  normalizedX: number; // 0 to 1
  normalizedY: number; // 0 to 1
  pinchDistance: number; // Euclidean distance between thumb tip (4) and index tip (8)
  isPinching: boolean;
  landmarks: NormalizedLandmark[];
  handedness: 'Left' | 'Right' | 'Unknown';
  fps: number;
}

export interface WindowState {
  id: AppId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
}

export type GlassTintTheme = 'pure' | 'obsidian' | 'titanium' | 'aurora';

export type EnvironmentId =
  | 'passthrough'
  | 'yosemite'
  | 'haleakala'
  | 'moon'
  | 'borabora'
  | 'joshuatree';

export interface VisionOSSettings {
  cameraEnabled: boolean;
  cameraFacingMode: 'environment' | 'user';
  mirrorCamera: boolean;
  handTrackingEnabled: boolean;
  trackingEngine: 'mediapipe' | 'tensorflow';
  showHandSkeleton: boolean;
  pinchSensitivity: number; // 0.035 to 0.11 (default 0.065)
  cursorSmoothing: number; // 0.15 to 0.85
  vrMode: boolean;
  vrIpdOffset: number; // 56 to 72 mm
  vrLensDistortion: boolean;
  environmentId: EnvironmentId;
  immersionLevel: number; // 0 (Full Camera Passthrough) to 100 (Full Virtual Environment)
  glassBlur: number; // 16 to 64 px
  specularIntensity: number; // 0.15 to 0.75
  glassOpacity: number; // 0.08 to 0.32
  glassTheme: GlassTintTheme;
  depthTiltEnabled: boolean;
  soundEffectsEnabled: boolean;
  uiScale: 'compact' | 'default' | 'spacious';
}

export interface SpatialPhoto {
  id: string;
  title: string;
  location: string;
  date: string;
  url: string;
  category: 'spatial' | 'panorama' | 'captured';
  isFavorite: boolean;
  depthLayers?: {
    foregroundCaption: string;
    focalLength: string;
    aperture: string;
  };
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  coverGradient: string;
  accentColor: string;
  bpm: number;
  rootFreq: number;
  chordNotes: number[];
  spatialMode: 'Dolby Atmos' | 'Lossless Spatial' | 'Binaural 3D';
  lyrics: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  timestamp: string;
  reaction?: string;
}

export interface Conversation {
  id: string;
  name: string;
  role: string;
  avatarGradient: string;
  initials: string;
  online: boolean;
  unread: number;
  messages: ChatMessage[];
}

export interface NoteItem {
  id: string;
  title: string;
  folder: 'Spatial Ideas' | 'Work' | 'Personal';
  updatedAt: string;
  content: string;
  checklist: { id: string; text: string; done: boolean }[];
  pinned: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  duration: string;
  location: string;
  category: 'keynote' | 'design' | 'spatial' | 'personal';
  dayOffset: number; // 0 = today, 1 = tomorrow, etc.
  attendees: string[];
}

export interface StoreAppItem {
  id: string;
  name: string;
  subtitle: string;
  category: 'Spatial Experiences' | 'Productivity' | 'Games' | 'Astronomy';
  rating: number;
  size: string;
  iconGradient: string;
  badge: string;
  description: string;
  installed: boolean;
  linkedCoreApp?: AppId;
}
