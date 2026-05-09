"use client";

import { useCallback, useEffect, useState } from "react";

import { resolveMediaCaptureError } from "@/lib/mediaCapture";
import { stopMediaStream } from "@/lib/sessionState";

type UseMediaCaptureResult = {
  stream: MediaStream | null;
  errorMessage: string;
  captureMode: "audio-video" | "audio-only" | "none";
  noticeMessage: string;
  requestMedia: () => Promise<MediaStream | null>;
  clearError: () => void;
};

export function useMediaCapture(): UseMediaCaptureResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [captureMode, setCaptureMode] = useState<"audio-video" | "audio-only" | "none">("none");
  const [noticeMessage, setNoticeMessage] = useState("");

  const requestMedia = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage(
        "Camera or microphone capture is not supported in this browser. Browser permission reset may be needed."
      );
      setCaptureMode("none");
      setNoticeMessage("");
      return null;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setStream(mediaStream);
      setErrorMessage("");
      setNoticeMessage("");
      setCaptureMode("audio-video");
      return mediaStream;
    } catch (error) {
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setStream(audioOnlyStream);
        setErrorMessage("");
        setCaptureMode("audio-only");
        setNoticeMessage(
          "Camera access is unavailable. Continuing in speech-only mode with microphone recording."
        );
        return audioOnlyStream;
      } catch (audioOnlyError) {
        setErrorMessage(resolveMediaCaptureError(audioOnlyError));
        setCaptureMode("none");
        setNoticeMessage("");
        return null;
      }
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage("");
    setNoticeMessage("");
  }, []);

  useEffect(() => {
    return () => {
      stopMediaStream(stream);
    };
  }, [stream]);

  return {
    stream,
    errorMessage,
    captureMode,
    noticeMessage,
    requestMedia,
    clearError,
  };
}
