import assert from "node:assert/strict";
import test from "node:test";

import {
  getNextCountdown,
  getPreferredAudioMimeType,
  MAX_RECORDING_SECONDS,
  resolveAudioRecordingError,
  resolveMediaCaptureError,
} from "./mediaCapture";

test("prefers opus webm when supported", () => {
  const mimeType = getPreferredAudioMimeType((value) => value === "audio/webm;codecs=opus");
  assert.equal(mimeType, "audio/webm;codecs=opus");
});

test("prefers audio/webm when supported", () => {
  const mimeType = getPreferredAudioMimeType((value) => value === "audio/webm");
  assert.equal(mimeType, "audio/webm");
});

test("falls back to audio/mp4 when webm is unsupported", () => {
  const mimeType = getPreferredAudioMimeType((value) => value === "audio/mp4");
  assert.equal(mimeType, "audio/mp4");
});

test("returns empty mime type when no preferred type is available", () => {
  const mimeType = getPreferredAudioMimeType(() => false);
  assert.equal(mimeType, "");
});

test("maps media permission errors to user-facing message", () => {
  const message = resolveMediaCaptureError({ name: "NotAllowedError" });
  assert.match(message, /permission reset may be needed/i);
});

test("maps no-device errors to user-facing message", () => {
  const message = resolveMediaCaptureError({ name: "NotFoundError" });
  assert.match(message, /no available camera or microphone input device/i);
});

test("maps unsupported audio recorder errors to user-facing message", () => {
  const message = resolveAudioRecordingError({ name: "NotSupportedError" });
  assert.match(message, /could not start audio recording/i);
});

test("countdown never goes below zero", () => {
  assert.equal(getNextCountdown(MAX_RECORDING_SECONDS), MAX_RECORDING_SECONDS - 1);
  assert.equal(getNextCountdown(1), 0);
  assert.equal(getNextCountdown(0), 0);
});
