import { useCallback, useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

type Phase = "idle" | "starting" | "searching" | "found" | "error";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("Your camera stays on this device.");
  const [faceBox, setFaceBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [faceCount, setFaceCount] = useState(0);

  const stop = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    setFaceBox(null);
    setFaceCount(0);
    lastVideoTimeRef.current = -1;
    setPhase("idle");
    setMessage("Your camera stays on this device.");
  }, []);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    landmarkerRef.current?.close();
  }, []);

  const start = async () => {
    if (phase === "starting" || phase === "searching" || phase === "found") return;
    setPhase("starting");
    setMessage("Starting your camera…");
    setFaceBox(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access needs a secure connection (HTTPS) and a supported browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } },
      });
      streamRef.current = stream;
      if (!videoRef.current) throw new Error("The camera preview could not be started.");
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setMessage("Loading face detection…");
      const files = await FilesetResolver.forVisionTasks(WASM_URL);
      const detector = await FaceLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numFaces: 5,
        minFaceDetectionConfidence: 0.55,
        minFacePresenceConfidence: 0.55,
        minTrackingConfidence: 0.55,
      }).catch(async () => FaceLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
        runningMode: "VIDEO",
        numFaces: 5,
        minFaceDetectionConfidence: 0.55,
        minFacePresenceConfidence: 0.55,
        minTrackingConfidence: 0.55,
      }));
      landmarkerRef.current = detector;
      setPhase("searching");
      setMessage("Looking for a face. Move into the frame.");

      timerRef.current = window.setInterval(() => {
        const video = videoRef.current;
        const model = landmarkerRef.current;
        if (!video || !model || video.readyState < 2 || video.currentTime === lastVideoTimeRef.current) return;
        lastVideoTimeRef.current = video.currentTime;
        try {
          const result = model.detectForVideo(video, performance.now());
          const detections = result.faceLandmarks ?? [];
          setFaceCount(detections.length);
          const bounds = result.faceLandmarks?.[0]?.length ? result.faceLandmarks[0] : null;
          if (bounds) {
            const xs = bounds.map((point) => point.x);
            const ys = bounds.map((point) => point.y);
            const left = Math.max(0, Math.min(...xs));
            const top = Math.max(0, Math.min(...ys));
            const right = Math.min(1, Math.max(...xs));
            const bottom = Math.min(1, Math.max(...ys));
            setFaceBox({ x: (1 - right) * 100, y: top * 100, width: (right - left) * 100, height: (bottom - top) * 100 });
            setPhase("found");
            setMessage(detections.length === 1 ? "Face detected" : `${detections.length} faces detected`);
          } else {
            setFaceBox(null);
            setPhase("searching");
            setMessage("No face detected — move into the frame.");
          }
        } catch {
          setMessage("Detection paused. Please restart the camera.");
        }
      }, 66);
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      setPhase("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong while starting face detection.");
    }
  };

  const active = phase === "searching" || phase === "found";

  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand-mark">W</div>
        <span>WEBVISION <i> / FACE SCAN</i></span>
        <span className="local-tag"><b /> ON-DEVICE</span>
      </header>

      <section className="hero">
        <p className="eyebrow">01 — INITIALIZE YOUR SESSION</p>
        <h1>Let’s find<br /><span>your face.</span></h1>
        <p className="intro">Face detection is the first step. Center yourself in the camera and WebVision will locate your face in real time.</p>
      </section>

      <section className="scanner-layout" aria-label="Face detection">
        <div className="camera-panel">
          <div className="camera-heading">
            <span>LIVE CAMERA</span>
            <span className={active ? "live-indicator active" : "live-indicator"}><b /> {active ? "LIVE" : "STANDBY"}</span>
          </div>
          <div className="camera-stage">
            <video ref={videoRef} autoPlay muted playsInline />
            {!active && <div className="camera-placeholder">
              <div className="face-glyph"><span /><span /><i /></div>
              <p>{phase === "starting" ? "INITIALIZING" : "CAMERA NOT STARTED"}</p>
            </div>}
            {faceBox && active && <div className="face-outline" style={{ left: `${faceBox.x}%`, top: `${faceBox.y}%`, width: `${faceBox.width}%`, height: `${faceBox.height}%` }}><span>FACE 01</span></div>}
            <div className="scan-corners"><i /><i /><i /><i /></div>
            {active && <div className="scan-line" />}
          </div>
          <div className="camera-footer"><span> {message}</span><span>{faceCount > 0 ? `${faceCount} FOUND` : "—"}</span></div>
        </div>

        <aside className="status-panel">
          <p className="eyebrow">DETECTION STATUS</p>
          <div className={phase === "found" ? "status-orb found" : "status-orb"}><div /></div>
          <h2>{phase === "found" ? "Face located" : phase === "searching" ? "Scanning…" : phase === "starting" ? "Preparing…" : phase === "error" ? "Camera unavailable" : "Ready when you are"}</h2>
          <p className="status-copy">{message}</p>
          <div className="readout"><span>FACES IN FRAME</span><strong>{String(faceCount).padStart(2, "0")}</strong></div>
          <button className="primary-button" onClick={active ? stop : start} disabled={phase === "starting"}>
            {phase === "starting" ? "PLEASE WAIT…" : active ? "STOP SCAN" : phase === "error" ? "TRY AGAIN" : "ENABLE CAMERA"} <span>↗</span>
          </button>
          <p className="privacy-note">Your video is processed locally in your browser. No footage is uploaded or stored.</p>
        </aside>
      </section>
      <footer className="bottomline"><span>WEBVISION — FACE DETECTION</span><span>CAMERA ACCESS REQUIRED · HTTPS</span></footer>
    </main>
  );
}
