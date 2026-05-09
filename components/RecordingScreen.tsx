import React, { useEffect, useRef } from "react";

import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useMediaCapture } from "@/hooks/useMediaCapture";
import { MAX_RECORDING_SECONDS } from "@/lib/mediaCapture";
type RecordingScreenProps = {
  onContinue: () => void;
  continueLabel: string;
  onStreamReady: (stream: MediaStream | null) => void;
  onAudioReady: (audioBlob: Blob | null) => void;
  onError: (message: string) => void;
  transcriptInputValue: string;
  onTranscriptInputChange: (value: string) => void;
  onLoadSampleTranscript: () => void;
  isPreparingReview: boolean;
};

export function RecordingScreen({
  onContinue,
  continueLabel,
  onStreamReady,
  onAudioReady,
  onError,
  transcriptInputValue,
  onTranscriptInputChange,
  onLoadSampleTranscript,
  isPreparingReview,
}: RecordingScreenProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
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
    onError("");
  };

  const hasAudio = Boolean(audioBlob);
  const hasTranscriptFallback = transcriptInputValue.trim().length > 0;

  return (
    <section className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h2 className="text-2xl font-semibold">Recording</h2>
      <p className="mt-3 max-w-2xl text-zinc-300">
        Record up to {MAX_RECORDING_SECONDS} seconds. This step uses your local camera preview and microphone
        to prepare a transcript.
      </p>
      {noticeMessage ? <p className="mt-3 text-sm text-amber-300">{noticeMessage}</p> : null}
      <p className="mt-3 text-sm text-zinc-400">
        Visible emotional cue language remains a visible tone estimate only.
      </p>
      <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950">
          {stream && captureMode === "audio-video" ? (
            <video autoPlay className="h-64 w-full object-cover" muted playsInline ref={videoRef} />
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
              {captureMode === "audio-only"
                ? "Speech-only mode is active. Webcam preview is disabled."
                : "Webcam preview appears after permission is granted."}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-md border border-zinc-700 bg-zinc-900 p-3">
            <p className="text-sm text-zinc-300">
              Timer: <span className="font-semibold text-zinc-100">{remainingSeconds}s</span>
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Status:{" "}
              <span className={isRecording ? "font-semibold text-rose-300" : "font-semibold text-zinc-200"}>
                {isRecording ? "Recording" : hasAudio ? "Recorded" : "Idle"}
              </span>
            </p>
          </div>

          {!isRecording ? (
            <button
              className="w-full rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!supportsMediaRecorder}
              onClick={handleStartCapture}
              type="button"
            >
              {hasAudio ? "Record again" : "Start recording"}
            </button>
          ) : (
            <button
              className="w-full rounded-md bg-rose-300 px-4 py-2 text-sm font-medium text-zinc-950"
              onClick={stopRecording}
              type="button"
            >
              Stop recording
            </button>
          )}

          <button
            className="w-full rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!hasAudio}
            onClick={handleRetake}
            type="button"
          >
            Clear recording
          </button>
        </div>
      </div>

      {mediaError ? <p className="mt-4 text-sm text-rose-300">{mediaError}</p> : null}
      {!supportsMediaRecorder ? (
        <p className="mt-4 text-sm text-rose-300">
          Audio recording is not supported in this browser (MediaRecorder unavailable).
        </p>
      ) : null}

      <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
        <h3 className="font-medium text-zinc-100">Transcript fallback</h3>
        <p className="mt-2 text-sm text-zinc-400">
          If microphone recording fails, you can continue by pasting text or loading a sample transcript.
        </p>
        <textarea
          className="mt-3 min-h-28 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          onChange={(event) => onTranscriptInputChange(event.target.value)}
          placeholder="Type or paste a reflection transcript for fallback mode."
          value={transcriptInputValue}
        />
        <button
          className="mt-3 rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-100"
          onClick={onLoadSampleTranscript}
          type="button"
        >
          Load sample transcript
        </button>
      </div>

      <button
        className="mt-5 rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={(!hasAudio && !hasTranscriptFallback) || isPreparingReview}
        onClick={onContinue}
        type="button"
      >
        {isPreparingReview ? "Preparing review..." : continueLabel}
      </button>
    </section>
  );
}
