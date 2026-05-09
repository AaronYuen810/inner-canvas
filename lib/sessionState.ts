export type AppStage = "intro" | "consent" | "recording" | "result";

export type MixedSignalBrief = {
  transcriptSummary: string;
  spokenValence: "negative" | "mixed" | "neutral" | "positive";
  visualAffect: "calm" | "guarded" | "tense" | "sad" | "restless" | "warm" | "flat" | "unreadable";
  signalRelationship: "aligned" | "contrasting" | "amplifying" | "masking" | "ambivalent" | "unclear";
  sceneEnergy: "still" | "low" | "medium" | "high";
  spatialMood: "open" | "balanced" | "compressed" | "fragmented";
  paletteMood: "muted_warm" | "muted_cool" | "earthy" | "desaturated" | "high_contrast" | "luminous";
  abstractionLevel: "symbolic" | "semi_figurative" | "abstract";
  confidence: "low" | "medium" | "high";
  spokenThemes: string[];
  spokenEmotions: string[];
  visualAffectSignals: string[];
  signalTensions: string[];
  symbolicElements: string[];
  sceneConcept: string;
  atmosphere: string;
  composition: string;
};

export type DerivedEmotionalContext = Pick<
  MixedSignalBrief,
  | "visualAffect"
  | "visualAffectSignals"
  | "signalRelationship"
  | "signalTensions"
  | "sceneEnergy"
  | "spatialMood"
  | "paletteMood"
  | "confidence"
>;

export type SessionState = {
  stage: AppStage;
  mediaStream: MediaStream | null;
  audioBlob: Blob | null;
  transcript: string;
  stagedTranscript: string;
  sampledFaceFrames: string[];
  mixedSignalBrief: MixedSignalBrief | null;
  derivedEmotionalContext: DerivedEmotionalContext | null;
  generatedPrompt: string;
  generatedImage: string;
  isLoading: boolean;
  errorMessage: string;
};

export const STAGE_ORDER: AppStage[] = ["intro", "consent", "recording", "result"];

export const INITIAL_SESSION_STATE: SessionState = {
  stage: "intro",
  mediaStream: null,
  audioBlob: null,
  transcript: "",
  stagedTranscript: "",
  sampledFaceFrames: [],
  mixedSignalBrief: null,
  derivedEmotionalContext: null,
  generatedPrompt: "",
  generatedImage: "",
  isLoading: false,
  errorMessage: "",
};

export function canTransition(from: AppStage, to: AppStage): boolean {
  const fromIndex = STAGE_ORDER.indexOf(from);
  const toIndex = STAGE_ORDER.indexOf(to);

  if (fromIndex === -1 || toIndex === -1) {
    return false;
  }

  return toIndex === fromIndex + 1;
}

export function stopMediaStream(stream: MediaStream | null): void {
  if (!stream) {
    return;
  }

  stream.getTracks().forEach((track) => track.stop());
}

export function resetSessionState(
  previousState: SessionState,
  fallbackStage: "intro" | "consent" = "intro"
): SessionState {
  stopMediaStream(previousState.mediaStream);

  return {
    ...INITIAL_SESSION_STATE,
    stage: fallbackStage,
  };
}
