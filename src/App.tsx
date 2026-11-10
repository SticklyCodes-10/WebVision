import { useEffect, useRef } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let detector: FaceLandmarker | null = null;
    let frameId = 0;
    let lastDetection = 0;
    let wasBlinking = false;
    let blinkTimer: ReturnType<typeof setTimeout> | undefined;
    let smoothX = 0.5;
    let smoothY = 0.5;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 30 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!video || !canvas || !context) return;

        video.srcObject = stream;
        await video.play();

        const files = await FilesetResolver.forVisionTasks(WASM_URL);
        if (cancelled) return;

        detector = await FaceLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true,
          minFaceDetectionConfidence: 0.55,
          minFacePresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
        }).catch(() => FaceLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true,
          minFaceDetectionConfidence: 0.55,
          minFacePresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
        }));

        if (cancelled) {
          detector.close();
          detector = null;
          return;
        }

        const detect = (now: number) => {
          if (cancelled) return;
          frameId = requestAnimationFrame(detect);
          if (!detector || video.readyState < 2 || now - lastDetection < 33) return;
          lastDetection = now;

          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          const result = detector.detectForVideo(video, now);
          context.clearRect(0, 0, canvas.width, canvas.height);

          const landmarks = result.faceLandmarks?.[0];
          if (!landmarks) {
            wasBlinking = false;
            return;
          }

          // Track the iris relative to each eye, then map that gaze across the screen.
          const eyeRatio = (iris: number, inner: number, outer: number) => {
            const a = landmarks[inner].x;
            const b = landmarks[outer].x;
            const low = Math.min(a, b);
            const width = Math.max(0.0001, Math.abs(b - a));
            return (landmarks[iris].x - low) / width;
          };
          const leftGaze = eyeRatio(468, 33, 133);
          const rightGaze = eyeRatio(473, 362, 263);
          const gazeX = (leftGaze + rightGaze) / 2;
          const eyeMidY = (landmarks[159].y + landmarks[386].y) / 2;
          const lowerMidY = (landmarks[145].y + landmarks[374].y) / 2;
          const irisMidY = (landmarks[468].y + landmarks[473].y) / 2;
          const gazeY = (irisMidY - eyeMidY) / Math.max(0.0001, lowerMidY - eyeMidY);

          // Amplify the small iris movement so it can reach most of the display.
          const targetX = Math.max(0.02, Math.min(0.98, 1 - (0.5 + (gazeX - 0.5) * 3.2)));
          const targetY = Math.max(0.02, Math.min(0.98, 0.5 + (gazeY - 0.5) * 3.2));
          smoothX += (targetX - smoothX) * 0.22;
          smoothY += (targetY - smoothY) * 0.22;

          const dot = dotRef.current;
          if (dot) {
            dot.style.left = `${smoothX * 100}%`;
            dot.style.top = `${smoothY * 100}%`;
          }

          const categories = result.faceBlendshapes?.[0]?.categories ?? [];
          const blinkLeft = categories.find((item) => item.categoryName === "eyeBlinkLeft")?.score ?? 0;
          const blinkRight = categories.find((item) => item.categoryName === "eyeBlinkRight")?.score ?? 0;
          const blinking = blinkLeft > 0.62 && blinkRight > 0.62;

          if (blinking && !wasBlinking && dot) {
            dot.style.backgroundColor = "#22c55e";
            if (blinkTimer) clearTimeout(blinkTimer);
            blinkTimer = setTimeout(() => {
              if (dotRef.current) dotRef.current.style.backgroundColor = "#ffffff";
            }, 260);
          }
          wasBlinking = blinking;
        };

        frameId = requestAnimationFrame(detect);
      } catch {
        // Keep the camera-only page clean if permission or model loading fails.
      }
    };

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      if (blinkTimer) clearTimeout(blinkTimer);
      stream?.getTracks().forEach((track) => track.stop());
      detector?.close();
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  return (
    <main className="camera-only">
      <video ref={videoRef} autoPlay muted playsInline />
      <canvas ref={canvasRef} />
      <div ref={dotRef} className="gaze-dot" />
    </main>
  );
}
