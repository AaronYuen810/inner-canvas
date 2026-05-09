export const DEFAULT_VISIBLE_TONES = [
  "thoughtful",
  "soft",
  "tense",
  "animated",
  "quiet",
  "slightly hopeful",
];

export type VisibleCueMetrics = {
  faceDetected: boolean;
  movement: number;
  offCenter: number;
};

export type VisibleCueEstimate = {
  cueSignals: string[];
  suggestedTone: string[];
  message: string;
};

function dedupeTone(tones: string[]): string[] {
  const unique = new Set(tones.map((tone) => tone.trim().toLowerCase()).filter(Boolean));
  return DEFAULT_VISIBLE_TONES.filter((tone) => unique.has(tone));
}

export function buildFallbackVisibleCueEstimate(): VisibleCueEstimate {
  return {
    cueSignals: ["manual tone selection"],
    suggestedTone: ["thoughtful", "soft", "quiet"],
    message:
      "Automatic local cue estimation is unavailable right now. Continue with manual visible tone selection.",
  };
}

export function deriveVisibleCueEstimate(metrics: VisibleCueMetrics): VisibleCueEstimate {
  if (!metrics.faceDetected) {
    return {
      cueSignals: ["face not detected", "manual tone selection"],
      suggestedTone: ["thoughtful", "soft", "quiet"],
      message:
        "No face was detected in the local preview. You can continue in manual visible tone mode.",
    };
  }

  const cueSignals = ["face present"];
  const tones = ["thoughtful"];

  if (metrics.movement > 0.05) {
    cueSignals.push("head movement");
    cueSignals.push("higher motion intensity");
    tones.push("animated");
  } else {
    cueSignals.push("head stillness");
    tones.push("quiet");
  }

  if (metrics.offCenter > 0.18) {
    cueSignals.push("looking away");
    tones.push("tense");
  } else {
    cueSignals.push("steady gaze");
    tones.push("soft");
  }

  if (metrics.movement <= 0.05 && metrics.offCenter <= 0.12) {
    tones.push("slightly hopeful");
  }

  return {
    cueSignals,
    suggestedTone: dedupeTone(tones),
    message: "Local visible cue estimate updated from on-device webcam frames.",
  };
}
