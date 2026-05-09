const MAX_RECORDING_SECONDS = 30;

const AUDIO_RECORDER_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

export function getPreferredAudioMimeType(
  isTypeSupported: ((mimeType: string) => boolean) | undefined
): string {
  if (!isTypeSupported) {
    return "audio/webm";
  }

  for (const mimeType of AUDIO_RECORDER_MIME_TYPES) {
    if (isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return "";
}

export function resolveAudioRecordingError(error: unknown): string {
  if (!error || typeof error !== "object" || !("name" in error)) {
    return "Audio recording could not be started. Please retry after checking microphone access.";
  }

  const name = String(error.name);

  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Microphone access was denied. Browser permission reset may be needed.";
  }

  if (name === "NotReadableError") {
    return "The microphone is currently unavailable. Close other apps using it and retry.";
  }

  if (name === "NotSupportedError") {
    return "This browser could not start audio recording with the available microphone format.";
  }

  return "Audio recording could not be started. Please retry after checking microphone access.";
}

export function resolveMediaCaptureError(error: unknown): string {
  if (!error || typeof error !== "object" || !("name" in error)) {
    return "Unable to access camera and microphone. Please try again.";
  }

  const name = String(error.name);

  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Camera or microphone access was denied. Browser permission reset may be needed.";
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No available camera or microphone input device was found.";
  }

  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Camera or microphone is currently unavailable. Close other apps using these devices and retry.";
  }

  if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
    return "Requested camera or microphone settings are not supported on this device.";
  }

  return "Unable to access camera and microphone. Please try again.";
}

export function getNextCountdown(remainingSeconds: number): number {
  return Math.max(0, remainingSeconds - 1);
}

export { MAX_RECORDING_SECONDS };
