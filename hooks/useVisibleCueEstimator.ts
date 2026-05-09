"use client";

import { useEffect, useState } from "react";

import {
  buildFallbackVisibleCueEstimate,
  deriveVisibleCueEstimate,
  VisibleCueEstimate,
} from "@/lib/visibleCue";

type VisibleCueEstimatorStatus = "idle" | "estimating" | "ready" | "fallback";
type VisibleCueEstimatorSource = "face-detector" | "manual-fallback";

type UseVisibleCueEstimatorResult = VisibleCueEstimate & {
  status: VisibleCueEstimatorStatus;
  source: VisibleCueEstimatorSource;
};

type FaceBox = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

type FaceDetectionResult = {
  boundingBox?: FaceBox;
};

type FaceDetectorLike = {
  detect: (input: HTMLVideoElement) => Promise<FaceDetectionResult[]>;
};

type FaceDetectorCtor = new (options?: {
  fastMode?: boolean;
  maxDetectedFaces?: number;
}) => FaceDetectorLike;

const DEFAULT_RESULT: UseVisibleCueEstimatorResult = {
  ...buildFallbackVisibleCueEstimate(),
  status: "idle",
  source: "manual-fallback",
};

export function useVisibleCueEstimator(stream: MediaStream | null): UseVisibleCueEstimatorResult {
  const [result, setResult] = useState<UseVisibleCueEstimatorResult>(DEFAULT_RESULT);

  useEffect(() => {
    const videoTrack = stream?.getVideoTracks().find((track) => track.readyState === "live");
    if (!stream || !videoTrack) {
      setResult({
        ...buildFallbackVisibleCueEstimate(),
        status: "fallback",
        source: "manual-fallback",
      });
      return;
    }

    const detectorCtor = (window as Window & { FaceDetector?: FaceDetectorCtor }).FaceDetector;
    if (!detectorCtor) {
      setResult({
        ...buildFallbackVisibleCueEstimate(),
        status: "fallback",
        source: "manual-fallback",
      });
      return;
    }

    let isCancelled = false;
    let previousCenter: { x: number; y: number } | null = null;
    const videoElement = document.createElement("video");
    videoElement.autoplay = true;
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.srcObject = stream;

    const detector = new detectorCtor({
      fastMode: true,
      maxDetectedFaces: 1,
    });

    setResult((previous) => ({
      ...previous,
      status: "estimating",
      source: "face-detector",
      message: "Estimating local visible cues from webcam preview...",
    }));

    const estimate = async () => {
      try {
        const faces = await detector.detect(videoElement);
        if (isCancelled) {
          return;
        }

        if (!Array.isArray(faces) || faces.length === 0) {
          previousCenter = null;
          setResult({
            ...deriveVisibleCueEstimate({
              faceDetected: false,
              movement: 0,
              offCenter: 0,
            }),
            status: "ready",
            source: "face-detector",
          });
          return;
        }

        const face = faces[0];
        const box = face?.boundingBox || {};
        const width = Math.max(videoElement.videoWidth, 1);
        const height = Math.max(videoElement.videoHeight, 1);
        const centerX = ((box.x || 0) + (box.width || 0) / 2) / width;
        const centerY = ((box.y || 0) + (box.height || 0) / 2) / height;
        const offCenter = Math.hypot(centerX - 0.5, centerY - 0.5);
        const movement = previousCenter
          ? Math.hypot(centerX - previousCenter.x, centerY - previousCenter.y)
          : 0;

        previousCenter = { x: centerX, y: centerY };

        setResult({
          ...deriveVisibleCueEstimate({
            faceDetected: true,
            movement,
            offCenter,
          }),
          status: "ready",
          source: "face-detector",
        });
      } catch {
        if (isCancelled) {
          return;
        }

        setResult({
          ...buildFallbackVisibleCueEstimate(),
          status: "fallback",
          source: "manual-fallback",
        });
      }
    };

    const interval = window.setInterval(() => {
      void estimate();
    }, 1200);

    void estimate();

    return () => {
      isCancelled = true;
      window.clearInterval(interval);
      videoElement.srcObject = null;
    };
  }, [stream]);

  return result;
}
