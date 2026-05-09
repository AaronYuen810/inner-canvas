export type AppStage =
  | "intro"
  | "consent"
  | "recording"
  | "review"
  | "generating"
  | "result";

export type ReflectionAnalysis = {
  summary: string;
  themes: string[];
  emotionalKeywords: string[];
  metaphors: string[];
  conflicts: string[];
  visualSymbols: string[];
  oneSentenceInterpretation: string;
};

export type SessionState = {
  stage: AppStage;
  mediaStream: MediaStream | null;
  audioBlob: Blob | null;
  transcript: string;
  reflectionAnalysis: ReflectionAnalysis | null;
  visibleCueEstimate: string[];
  confirmedVisibleTone: string[];
  generatedPrompt: string;
  generatedImage: string;
  isLoading: boolean;
  errorMessage: string;
};

export const STAGE_ORDER: AppStage[] = [
  "intro",
  "consent",
  "recording",
  "review",
  "generating",
  "result",
];

export const INITIAL_SESSION_STATE: SessionState = {
  stage: "intro",
  mediaStream: null,
  audioBlob: null,
  transcript: "",
  reflectionAnalysis: null,
  visibleCueEstimate: [],
  confirmedVisibleTone: [],
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
