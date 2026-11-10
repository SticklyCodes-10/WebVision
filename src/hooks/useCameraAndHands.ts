import { useCallback, useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandGestureType, HandTelemetry, NormalizedLandmark } from '../types/vision';
import { spatialAudio } from '../utils/soundEffects';

interface UseCameraAndHandsOptions {
  cameraEnabled: boolean;
  facingMode: 'environment' | 'user';
  mirrorCamera: boolean;
  handTrackingEnabled: boolean;
  pinchSensitivity: number;
  cursorSmoothing: number;
  onPinchStart?: (x: number, y: number) => void;
  onPinchMove?: (x: number, y: number, dx: number, dy: number) => void;
  onPinchEnd?: (x: number, y: number) => void;
  onOpenPalmTrigger?: () => void;
  onClosedFistTrigger?: () => void;
  onTwoFingersTrigger?: () => void;
}

function dist2D(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function useCameraAndHands({
  cameraEnabled,
  facingMode,
  mirrorCamera,
  handTrackingEnabled,
  pinchSensitivity,
  cursorSmoothing,
  onPinchStart,
  onPinchMove,
  onPinchEnd,
  onOpenPalmTrigger,
  onClosedFistTrigger,
  onTwoFingersTrigger,
}: UseCameraAndHandsOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);

  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'error'>('idle');
  const [cameraErrorMsg, setCameraErrorMsg] = useState<string | null>(null);
  const [activeCameraLabel, setActiveCameraLabel] = useState<string>('Rear Camera (environment)');
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const [telemetry, setTelemetry] = useState<HandTelemetry>({
    detected: false,
    gesture: 'none',
    confidence: 0,
    cursorX: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
    cursorY: typeof window !== 'undefined' ? window.innerHeight / 2 : 400,
    normalizedX: 0.5,
    normalizedY: 0.5,
    pinchDistance: 1,
    isPinching: false,
    landmarks: [],
    handedness: 'Unknown',
    fps: 0,
  });

  // Refs for gesture state machine to avoid stale closures in RAF
  const smoothedPosRef = useRef<{ x: number; y: number }>({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 400,
  });
  const wasPinchingRef = useRef<boolean>(false);
  const pinchCandidateFramesRef = useRef<number>(0);
  const lastTelemetryUpdateRef = useRef<number>(0);
  const discreteGestureFiredRef = useRef<boolean>(false);
  const gestureHoldStartRef = useRef<{ gesture: HandGestureType; timestamp: number }>({
    gesture: 'none',
    timestamp: 0,
  });
  const lastDiscreteTriggerRef = useRef<number>(0);
  const fpsCounterRef = useRef<{ frames: number; lastTime: number; fps: number }>({
    frames: 0,
    lastTime: performance.now(),
    fps: 30,
  });

  // Keep latest callbacks in refs
  const callbacksRef = useRef({
    onPinchStart,
    onPinchMove,
    onPinchEnd,
    onOpenPalmTrigger,
    onClosedFistTrigger,
    onTwoFingersTrigger,
    pinchSensitivity,
    cursorSmoothing,
    mirrorCamera,
    facingMode,
  });

  useEffect(() => {
    callbacksRef.current = {
      onPinchStart,
      onPinchMove,
      onPinchEnd,
      onOpenPalmTrigger,
      onClosedFistTrigger,
      onTwoFingersTrigger,
      pinchSensitivity,
      cursorSmoothing,
      mirrorCamera,
      facingMode,
    };
  }, [
    onPinchStart,
    onPinchMove,
    onPinchEnd,
    onOpenPalmTrigger,
    onClosedFistTrigger,
    onTwoFingersTrigger,
    pinchSensitivity,
    cursorSmoothing,
    mirrorCamera,
    facingMode,
  ]);

  // Stop existing camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStatus('idle');
  }, []);

  // Start Rear or Front Camera using navigator.mediaDevices.getUserMedia
  const startCamera = useCallback(
    async (requestedFacingMode: 'environment' | 'user' = facingMode) => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraStatus('error');
        setCameraErrorMsg('Camera API (getUserMedia) is not supported in this browser context.');
        return false;
      }

      setCameraStatus('requesting');
      setCameraErrorMsg(null);

      // Stop any prior tracks before requesting new camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      try {
        let stream: MediaStream;
        try {
          // Primary request: Explicitly request facingMode ("environment" for smartphone rear camera)
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: requestedFacingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch {
          // Fallback to any available video input device (e.g. desktop webcam without environment tag)
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        streamRef.current = stream;
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const label = videoTrack.label || (requestedFacingMode === 'environment' ? 'Rear Camera' : 'Front Camera');
          setActiveCameraLabel(label);
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        setCameraStatus('active');
        return true;
      } catch (err: unknown) {
        const errorName = err instanceof Error ? err.name : 'CameraError';
        if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
          setCameraStatus('denied');
          setCameraErrorMsg('Camera permission was declined. Touch and mouse controls remain fully active.');
        } else {
          setCameraStatus('error');
          setCameraErrorMsg('No physical camera stream detected on this device. Spatial Environment & Touch fallback active.');
        }
        return false;
      }
    },
    [facingMode]
  );

  // Sync cameraEnabled & facingMode changes
  useEffect(() => {
    if (cameraEnabled) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      // Cleanup on unmount
    };
  }, [cameraEnabled, facingMode, startCamera, stopCamera]);

  // Initialize MediaPipe HandLandmarker when handTrackingEnabled is true
  useEffect(() => {
    let cancelled = false;

    async function initMediaPipe() {
      if (!handTrackingEnabled || landmarkerRef.current) return;
      setModelStatus('loading');
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm'
        );
        if (cancelled) return;

        let landmarker: HandLandmarker;
        try {
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands: 1,
            minHandDetectionConfidence: 0.48,
            minHandPresenceConfidence: 0.48,
            minTrackingConfidence: 0.48,
          });
        } catch {
          // CPU fallback if WebGL GPU delegate isn't available
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: 1,
            minHandDetectionConfidence: 0.45,
            minHandPresenceConfidence: 0.45,
            minTrackingConfidence: 0.45,
          });
        }

        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;
        setModelStatus('ready');
      } catch (err) {
        console.warn('MediaPipe HandLandmarker initialization warning:', err);
        if (!cancelled) {
          setModelStatus('error');
        }
      }
    }

    if (handTrackingEnabled) {
      initMediaPipe();
    }

    return () => {
      cancelled = true;
    };
  }, [handTrackingEnabled]);

  // Real-time MediaPipe Video Detection Loop
  useEffect(() => {
    if (!cameraEnabled || !handTrackingEnabled || cameraStatus !== 'active' || modelStatus !== 'ready') {
      setTelemetry((prev) => (prev.detected ? { ...prev, detected: false, gesture: 'none', isPinching: false } : prev));
      return;
    }

    let lastVideoTime = -1;
    let lastDetectionTime = 0;
    let active = true;

    const detectFrame = () => {
      if (!active) return;

      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (video && landmarker && video.readyState >= 2 && video.videoWidth > 0) {
        const now = performance.now();

        // Update FPS counter
        fpsCounterRef.current.frames++;
        if (now - fpsCounterRef.current.lastTime >= 1000) {
          fpsCounterRef.current.fps = fpsCounterRef.current.frames;
          fpsCounterRef.current.frames = 0;
          fpsCounterRef.current.lastTime = now;
        }

        // Hand inference is expensive; cap it at ~30 FPS instead of running on every display refresh.
        if (video.currentTime !== lastVideoTime && now - lastDetectionTime >= 33) {
          lastVideoTime = video.currentTime;
          lastDetectionTime = now;
          try {
            const result = landmarker.detectForVideo(video, now);

            if (result.landmarks && result.landmarks.length > 0) {
              const lm = result.landmarks[0] as NormalizedLandmark[];
              const handednessCat = result.handednesses?.[0]?.[0];
              const handednessName = (handednessCat?.categoryName as 'Left' | 'Right') || 'Right';
              const confidence = handednessCat?.score ?? 0.92;

              // Key landmarks
              const wrist = lm[0];
              const thumbMcp = lm[2];
              const thumbTip = lm[4];
              const indexPip = lm[6];
              const indexTip = lm[8];
              const middlePip = lm[10];
              const middleTip = lm[12];
              const ringPip = lm[14];
              const ringTip = lm[16];
              const pinkyMcp = lm[17];
              const pinkyPip = lm[18];
              const pinkyTip = lm[20];

              // Calculate Pinch Distance between Thumb Tip (4) and Index Tip (8)
              const pinchDistance = dist2D(thumbTip, indexTip);
              const { pinchSensitivity: threshold, cursorSmoothing: smoothing, mirrorCamera: mirrored, facingMode: mode } =
                callbacksRef.current;

              // Determine finger extensions relative to wrist
              const indexExtended = dist2D(wrist, indexTip) > dist2D(wrist, indexPip) * 1.13;
              const middleExtended = dist2D(wrist, middleTip) > dist2D(wrist, middlePip) * 1.13;
              const ringExtended = dist2D(wrist, ringTip) > dist2D(wrist, ringPip) * 1.1;
              const pinkyExtended = dist2D(wrist, pinkyTip) > dist2D(wrist, pinkyPip) * 1.1;
              const thumbExtended = dist2D(pinkyMcp, thumbTip) > dist2D(pinkyMcp, thumbMcp) * 1.18;

              // Classify Gesture
              let gesture: HandGestureType = 'pointing';
              // Hysteresis prevents the pinch state flickering at the threshold.
              const pinchEnterThreshold = threshold;
              const pinchReleaseThreshold = threshold * 1.32;
              let isPinching = wasPinchingRef.current
                ? pinchDistance < pinchReleaseThreshold
                : pinchDistance < pinchEnterThreshold;
              if (!wasPinchingRef.current && isPinching) {
                pinchCandidateFramesRef.current += 1;
                isPinching = pinchCandidateFramesRef.current >= 2;
              } else if (!isPinching) {
                pinchCandidateFramesRef.current = 0;
              }

              if (isPinching) {
                gesture = 'pinch';
              } else if (
                indexExtended &&
                middleExtended &&
                ringExtended &&
                pinkyExtended &&
                thumbExtended &&
                pinchDistance > threshold * 1.35
              ) {
                gesture = 'open_palm';
              } else if (
                !indexExtended &&
                !middleExtended &&
                !ringExtended &&
                !pinkyExtended &&
                pinchDistance > threshold * 0.85
              ) {
                gesture = 'closed_fist';
              } else if (
                indexExtended &&
                middleExtended &&
                !ringExtended &&
                !pinkyExtended &&
                pinchDistance > threshold * 1.15
              ) {
                gesture = 'two_fingers';
              }

              // Compute cursor point (midpoint of thumb & index during pinch, or index tip)
              const rawNormX = isPinching ? (thumbTip.x + indexTip.x) * 0.5 : indexTip.x;
              const rawNormY = isPinching ? (thumbTip.y + indexTip.y) * 0.5 : indexTip.y;

              // Mirror X if front camera or mirrorCamera enabled
              const shouldFlipX = mirrored || mode === 'user';
              const normX = shouldFlipX ? 1 - rawNormX : rawNormX;
              const normY = rawNormY;

              const targetX = Math.max(12, Math.min(window.innerWidth - 12, normX * window.innerWidth));
              const targetY = Math.max(12, Math.min(window.innerHeight - 12, normY * window.innerHeight));

              // Smooth more at rest, but allow faster response during intentional movement.
              const prevX = smoothedPosRef.current.x;
              const prevY = smoothedPosRef.current.y;
              const distanceToTarget = Math.hypot(targetX - prevX, targetY - prevY);
              const configuredAlpha = 0.14 + (1 - smoothing) * 0.34;
              const movementBoost = Math.min(0.22, distanceToTarget / 900);
              const alpha = Math.max(0.12, Math.min(0.52, configuredAlpha + movementBoost));
              const nextX = distanceToTarget < 1.6 ? prevX : prevX + (targetX - prevX) * alpha;
              const nextY = distanceToTarget < 1.6 ? prevY : prevY + (targetY - prevY) * alpha;
              smoothedPosRef.current = { x: nextX, y: nextY };

              // Handle Pinch state transitions for real interactive clicks & window dragging
              if (isPinching && !wasPinchingRef.current) {
                wasPinchingRef.current = true;
                pinchCandidateFramesRef.current = 0;
                spatialAudio.playPinchClick();
                callbacksRef.current.onPinchStart?.(nextX, nextY);
              } else if (isPinching && wasPinchingRef.current) {
                callbacksRef.current.onPinchMove?.(nextX, nextY, nextX - prevX, nextY - prevY);
              } else if (!isPinching && wasPinchingRef.current) {
                wasPinchingRef.current = false;
                pinchCandidateFramesRef.current = 0;
                callbacksRef.current.onPinchEnd?.(nextX, nextY);
              }

              // Handle sustained discrete gestures (Open Palm, Closed Fist, Two Fingers)
              if (gesture === 'open_palm' || gesture === 'closed_fist' || gesture === 'two_fingers') {
                if (gestureHoldStartRef.current.gesture !== gesture) {
                  gestureHoldStartRef.current = { gesture, timestamp: now };
                } else if (
                  now - gestureHoldStartRef.current.timestamp > 500 &&
                  !discreteGestureFiredRef.current &&
                  now - lastDiscreteTriggerRef.current > 700
                ) {
                  discreteGestureFiredRef.current = true;
                  lastDiscreteTriggerRef.current = now;
                  spatialAudio.playGestureRecognized(gesture);
                  if (gesture === 'open_palm') {
                    callbacksRef.current.onOpenPalmTrigger?.();
                  } else if (gesture === 'closed_fist') {
                    callbacksRef.current.onClosedFistTrigger?.();
                  } else if (gesture === 'two_fingers') {
                    callbacksRef.current.onTwoFingersTrigger?.();
                  }
                }
              } else {
                gestureHoldStartRef.current = { gesture: 'none', timestamp: now };
                discreteGestureFiredRef.current = false;
              }

              // React state drives the UI, so publish telemetry at 20 Hz rather than
              // forcing the entire desktop to re-render on every camera frame.
              if (now - lastTelemetryUpdateRef.current >= 50) {
                lastTelemetryUpdateRef.current = now;
                setTelemetry({
                detected: true,
                gesture,
                confidence,
                cursorX: nextX,
                cursorY: nextY,
                normalizedX: normX,
                normalizedY: normY,
                pinchDistance,
                isPinching,
                landmarks: lm,
                handedness: handednessName,
                fps: fpsCounterRef.current.fps,
                });
              }
            } else {
              if (wasPinchingRef.current) {
                wasPinchingRef.current = false;
                pinchCandidateFramesRef.current = 0;
                callbacksRef.current.onPinchEnd?.(smoothedPosRef.current.x, smoothedPosRef.current.y);
              }
              gestureHoldStartRef.current = { gesture: 'none', timestamp: now };
              discreteGestureFiredRef.current = false;
              setTelemetry((prev) =>
                prev.detected
                  ? {
                      ...prev,
                      detected: false,
                      gesture: 'none',
                      isPinching: false,
                      landmarks: [],
                    }
                  : prev
              );
            }
          } catch {
            // Frame skip on transient video resize
          }
        }
      }

      rafRef.current = requestAnimationFrame(detectFrame);
    };

    rafRef.current = requestAnimationFrame(detectFrame);

    return () => {
      active = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [cameraEnabled, handTrackingEnabled, cameraStatus, modelStatus]);

  // Capture a live photo snapshot from the active camera video feed
  const captureCameraFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || cameraStatus !== 'active' || video.videoWidth === 0) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.88);
  }, [cameraStatus]);

  return {
    videoRef,
    cameraStatus,
    cameraErrorMsg,
    activeCameraLabel,
    modelStatus,
    telemetry,
    startCamera,
    stopCamera,
    captureCameraFrame,
  };
}
