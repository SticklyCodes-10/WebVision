import { useEffect, useRef } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let detector: FaceLandmarker | null = null;
    let frameId = 0;
    let lastDetection = 0;

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
          numFaces: 5,
          minFaceDetectionConfidence: 0.55,
          minFacePresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
        }).catch(() => FaceLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
          runningMode: "VIDEO",
          numFaces: 5,
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

          for (const landmarks of result.faceLandmarks ?? []) {
            if (!landmarks.length) continue;
            const xs = landmarks.map((point) => point.x * canvas.width);
            const ys = landmarks.map((point) => point.y * canvas.height);
            const left = Math.min(...xs);
            const top = Math.min(...ys);
            const right = Math.max(...xs);
            const bottom = Math.max(...ys);

            context.strokeStyle = "#a8f0bd";
            context.lineWidth = Math.max(2, canvas.width / 600);
            context.shadowColor = "#a8f0bd";
            context.shadowBlur = 14;
            context.strokeRect(left, top, right - left, bottom - top);
            context.shadowBlur = 0;
          }
        };

        frameId = requestAnimationFrame(detect);
      } catch {
        // Keep the page visually minimal if camera permission or model loading fails.
      }
    };

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      stream?.getTracks().forEach((track) => track.stop());
      detector?.close();
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  return (
    <main className="camera-only">
      <video ref={videoRef} autoPlay muted playsInline />
      <canvas ref={canvasRef} />
    </main>
  );
}
