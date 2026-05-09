"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getNextCountdown,
  getPreferredAudioMimeType,
  MAX_RECORDING_SECONDS,
  resolveAudioRecordingError,
} from "@/lib/mediaCapture";

type UseAudioRecorderResult = {
  audioBlob: Blob | null;
  isRecording: boolean;
  remainingSeconds: number;
  supportsMediaRecorder: boolean;
  startRecording: (stream: MediaStream) => string | null;
  stopRecording: () => void;
  clearRecording: () => void;
};

export function useAudioRecorder(maxDurationSeconds = MAX_RECORDING_SECONDS): UseAudioRecorderResult {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const countdownRef = useRef<number | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(maxDurationSeconds);

  const supportsMediaRecorder = useMemo(
    () => typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined",
    []
  );

  const stopRecording = useCallback(() => {
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }

    setIsRecording(false);
  }, []);

  const startRecording = useCallback(
    (stream: MediaStream) => {
      if (!supportsMediaRecorder) {
        return "Audio recording is not supported in this browser (MediaRecorder unavailable).";
      }

      const audioTracks = stream.getAudioTracks().filter((track) => track.readyState === "live");
      if (audioTracks.length === 0) {
        return "No active microphone track was found. Check microphone permission and retry.";
      }

      chunksRef.current = [];
      setAudioBlob(null);
      setRemainingSeconds(maxDurationSeconds);

      const audioStream = new MediaStream(audioTracks);
      const preferredMimeType = getPreferredAudioMimeType(window.MediaRecorder.isTypeSupported);
      let recorder: MediaRecorder;

      try {
        recorder = preferredMimeType
          ? new window.MediaRecorder(audioStream, { mimeType: preferredMimeType })
          : new window.MediaRecorder(audioStream);
      } catch (error) {
        return resolveAudioRecordingError(error);
      }

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blobType = preferredMimeType || chunksRef.current[0]?.type || "audio/webm";
        setAudioBlob(new Blob(chunksRef.current, { type: blobType }));
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error", event.error);
        stopRecording();
      };

      try {
        recorder.start();
      } catch (error) {
        return resolveAudioRecordingError(error);
      }

      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      countdownRef.current = window.setInterval(() => {
        setRemainingSeconds((previous) => {
          const next = getNextCountdown(previous);
          if (next === 0) {
            stopRecording();
          }
          return next;
        });
      }, 1000);

      return null;
    },
    [maxDurationSeconds, stopRecording, supportsMediaRecorder]
  );

  const clearRecording = useCallback(() => {
    stopRecording();
    setAudioBlob(null);
    setRemainingSeconds(maxDurationSeconds);
  }, [maxDurationSeconds, stopRecording]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        window.clearInterval(countdownRef.current);
      }
    };
  }, []);

  return {
    audioBlob,
    isRecording,
    remainingSeconds,
    supportsMediaRecorder,
    startRecording,
    stopRecording,
    clearRecording,
  };
}
