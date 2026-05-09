import React, { useCallback, useEffect, useRef } from "react";
import { FileText, Loader2, Mic, RotateCcw, Square } from "lucide-react";

import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useMediaCapture } from "@/hooks/useMediaCapture";
import { MAX_RECORDING_SECONDS } from "@/lib/mediaCapture";
type RecordingScreenProps = {
  onContinue: () => void;
  continueLabel: string;
  onStreamReady: (stream: MediaStream | null) => void;
  onAudioReady: (audioBlob: Blob | null) => void;
  onFaceFramesReady: (frames: string[]) => void;
  onError: (message: string) => void;
  transcriptInputValue: string;
  onTranscriptInputChange: (value: string) => void;
  onLoadSampleTranscript: () => void;
  isCreatingCanvas: boolean;
};

const MAX_FACE_FRAME_SAMPLES = 5;
const FACE_FRAME_SAMPLE_INTERVAL_MS = 3_000;

export function RecordingScreen({
  onContinue,
  continueLabel,
  onStreamReady,
  onAudioReady,
  onFaceFramesReady,
  onError,
  transcriptInputValue,
  onTranscriptInputChange,
  onLoadSampleTranscript,
  isCreatingCanvas,
}: RecordingScreenProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sampledFaceFramesRef = useRef<string[]>([]);
  const {
    stream,
    captureMode,
    noticeMessage,
    errorMessage: mediaError,
    requestMedia,
    clearError,
  } = useMediaCapture();
  const {
    audioBlob,
    isRecording,
    remainingSeconds,
    supportsMediaRecorder,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    onStreamReady(stream);
  }, [onStreamReady, stream]);

  useEffect(() => {
    onAudioReady(audioBlob);
  }, [audioBlob, onAudioReady]);

  const sampleFaceFrame = useCallback(() => {
    const video = videoRef.current;
    if (
      !video ||
      video.videoWidth === 0 ||
      video.videoHeight === 0 ||
      sampledFaceFramesRef.current.length >= MAX_FACE_FRAME_SAMPLES
    ) {
      return;
    }

    const maxSide = 512;
    const scale = Math.min(maxSide / Math.max(video.videoWidth, video.videoHeight), 1);
    const width = Math.max(Math.round(video.videoWidth * scale), 1);
    const height = Math.max(Math.round(video.videoHeight * scale), 1);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    const frame = canvas.toDataURL("image/jpeg", 0.72);
    sampledFaceFramesRef.current = [...sampledFaceFramesRef.current, frame];
    onFaceFramesReady(sampledFaceFramesRef.current);
  }, [onFaceFramesReady]);

  useEffect(() => {
    if (!isRecording || captureMode !== "audio-video") {
      return;
    }

    sampleFaceFrame();
    const interval = window.setInterval(() => {
      sampleFaceFrame();
    }, FACE_FRAME_SAMPLE_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [captureMode, isRecording, sampleFaceFrame]);

  useEffect(() => {
    if (!supportsMediaRecorder) {
      onError("Audio recording is not supported in this browser (MediaRecorder unavailable).");
    }
  }, [onError, supportsMediaRecorder]);

  useEffect(() => {
    onError(mediaError);
  }, [mediaError, onError]);

  const handleStartCapture = async () => {
    clearError();
    sampledFaceFramesRef.current = [];
    onFaceFramesReady([]);
    const mediaStream = await requestMedia();
    if (!mediaStream) {
      return;
    }

    if (!supportsMediaRecorder) {
      return;
    }

    const recordingError = startRecording(mediaStream);
    if (recordingError) {
      onError(recordingError);
    }
  };

  const handleRetake = () => {
    clearRecording();
    clearError();
    onAudioReady(null);
    sampledFaceFramesRef.current = [];
    onFaceFramesReady([]);
    onError("");
  };

  const hasAudio = Boolean(audioBlob);
  const hasTranscriptFallback = transcriptInputValue.trim().length > 0;

  return (
    <section className="journal-card w-full p-5 sm:p-7">
      <h2 className="font-serif text-3xl font-semibold leading-tight text-[color:var(--color-ink)]">
        Capture your reflection
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-[color:var(--color-muted)]">
        Take up to {MAX_RECORDING_SECONDS} seconds to speak plainly. The preview is here only to help you
        stay present while the reflection is captured.
      </p>
      <p className="journal-panel mt-4 px-3 py-2 text-sm text-[color:var(--color-muted)]">
        If camera is available, up to five low-detail still frames may be sampled during recording to help
        shape the first canvas. If camera is unavailable, reflection continues in audio/text-only mode.
      </p>
      {noticeMessage ? (
        <p className="journal-panel mt-4 px-3 py-2 text-sm text-[color:var(--color-muted)]">
          {noticeMessage}
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="overflow-hidden rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-ink)]">
          {stream && captureMode === "audio-video" ? (
            <video autoPlay className="aspect-video w-full object-cover" muted playsInline ref={videoRef} />
          ) : (
            <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-[rgb(255_250_242_/_0.72)]">
              {captureMode === "audio-only"
                ? "Audio reflection is active. The camera preview is unavailable."
                : "Your camera preview will appear after permission is granted."}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="journal-panel p-4">
            <p className="text-sm text-[color:var(--color-muted)]">
              Time left: <span className="font-semibold text-[color:var(--color-ink)]">{remainingSeconds}s</span>
            </p>
            <p className="mt-1 text-xs text-[color:var(--color-muted)]">
              Reflection:{" "}
              <span className={isRecording ? "font-semibold text-[color:var(--color-danger)]" : "font-semibold text-[color:var(--color-ink)]"}>
                {isRecording ? "Listening" : hasAudio ? "Saved" : "Ready"}
              </span>
            </p>
          </div>

          {!isRecording ? (
            <button
              className="journal-button-primary w-full"
              disabled={!supportsMediaRecorder}
              onClick={handleStartCapture}
              type="button"
            >
              <Mic aria-hidden="true" size={16} />
              {hasAudio ? "Record again" : "Start recording"}
            </button>
          ) : (
            <button
              className="journal-button-danger w-full bg-[rgb(159_59_52_/_0.08)]"
              onClick={stopRecording}
              type="button"
            >
              <Square aria-hidden="true" size={15} />
              Stop recording
            </button>
          )}

          <button
            className="journal-button-secondary w-full"
            disabled={!hasAudio}
            onClick={handleRetake}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={16} />
            Clear recording
          </button>
        </div>
      </div>

      {mediaError ? <p className="mt-4 text-sm text-[color:var(--color-danger)]">{mediaError}</p> : null}
      {!supportsMediaRecorder ? (
        <p className="mt-4 text-sm text-[color:var(--color-danger)]">
          Audio recording is not supported in this browser (MediaRecorder unavailable).
        </p>
      ) : null}

      <details className="journal-panel mt-5 p-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[color:var(--color-ink)] [&::-webkit-details-marker]:hidden">
          <FileText aria-hidden="true" size={16} />
          Need to type it instead?
        </summary>
        <p className="mt-3 text-sm leading-6 text-[color:var(--color-muted)]">
          If speaking is not available, write the reflection here or start from the sample.
        </p>
        <textarea
          className="journal-field mt-3 min-h-28 w-full px-3 py-2 text-sm"
          onChange={(event) => onTranscriptInputChange(event.target.value)}
          placeholder="Write or paste a short reflection."
          value={transcriptInputValue}
        />
        <button
          className="journal-button-secondary mt-3"
          onClick={onLoadSampleTranscript}
          type="button"
        >
          Use sample reflection
        </button>
      </details>

      <button
        className="journal-button-primary mt-5"
        disabled={(!hasAudio && !hasTranscriptFallback) || isCreatingCanvas}
        onClick={onContinue}
        type="button"
      >
        {isCreatingCanvas ? (
          <>
            <Loader2 aria-hidden="true" className="animate-spin" size={16} />
            Creating canvas...
          </>
        ) : (
          continueLabel
        )}
      </button>
    </section>
  );
}
