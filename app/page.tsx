"use client";

import { useCallback, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { IntroConsentScreen } from "@/components/IntroConsentScreen";
import { PrivacyResetButton } from "@/components/PrivacyResetButton";
import { RecordingScreen } from "@/components/RecordingScreen";
import { ResultScreen } from "@/components/ResultScreen";
import { buildImagePrompt } from "@/lib/promptBuilder";
import {
  AppStage,
  DerivedEmotionalContext,
  INITIAL_SESSION_STATE,
  MixedSignalBrief,
  SessionState,
  canTransition,
  resetSessionState,
} from "@/lib/sessionState";

const NEXT_STAGE_LABEL: Record<AppStage, AppStage | null> = {
  intro: "consent",
  consent: "recording",
  recording: "result",
  result: null,
};

const CONTINUE_LABEL_BY_STAGE: Partial<Record<AppStage, string>> = {
  intro: "Begin reflection",
  consent: "Continue privately",
  recording: "Create canvas",
};

const SAMPLE_TRANSCRIPT =
  "I have been carrying a lot of pressure this week, but I also notice moments where I pause and breathe. I want to hold both the strain and a small sense of hope as I figure out what to do next.";

const IMAGE_TIMEOUT_MS = 20_000;

type MixedSignalBriefRequest = {
  transcript: string;
  frames?: string[];
  previousDerivedEmotionalContext?: DerivedEmotionalContext;
};

type GenerateImageResponse = {
  imageBase64?: string;
  prompt?: string;
  error?: string;
};

function deriveEmotionalContextFromBrief(brief: MixedSignalBrief): DerivedEmotionalContext {
  return {
    visualAffect: brief.visualAffect,
    visualAffectSignals: brief.visualAffectSignals,
    signalRelationship: brief.signalRelationship,
    signalTensions: brief.signalTensions,
    sceneEnergy: brief.sceneEnergy,
    spatialMood: brief.spatialMood,
    paletteMood: brief.paletteMood,
    confidence: brief.confidence,
  };
}

function applyDerivedContext(
  brief: MixedSignalBrief,
  derivedEmotionalContext: DerivedEmotionalContext | null
): MixedSignalBrief {
  if (!derivedEmotionalContext) {
    return brief;
  }

  return {
    ...brief,
    visualAffect: derivedEmotionalContext.visualAffect,
    visualAffectSignals: derivedEmotionalContext.visualAffectSignals,
    signalRelationship: derivedEmotionalContext.signalRelationship,
    signalTensions: derivedEmotionalContext.signalTensions,
    sceneEnergy: derivedEmotionalContext.sceneEnergy,
    spatialMood: derivedEmotionalContext.spatialMood,
    paletteMood: derivedEmotionalContext.paletteMood,
    confidence: derivedEmotionalContext.confidence,
  };
}

function fallbackBriefFromTranscript(
  transcript: string,
  previousDerivedEmotionalContext: DerivedEmotionalContext | null = null
): MixedSignalBrief {
  const safeTranscript = transcript.trim();

  const fallback: MixedSignalBrief = {
    transcriptSummary: safeTranscript || "A short reflection was recorded.",
    spokenValence: "neutral",
    visualAffect: previousDerivedEmotionalContext?.visualAffect || "unreadable",
    signalRelationship: previousDerivedEmotionalContext?.signalRelationship || "unclear",
    sceneEnergy: previousDerivedEmotionalContext?.sceneEnergy || "low",
    spatialMood: previousDerivedEmotionalContext?.spatialMood || "balanced",
    paletteMood: previousDerivedEmotionalContext?.paletteMood || "desaturated",
    abstractionLevel: "symbolic",
    confidence: previousDerivedEmotionalContext?.confidence || "low",
    spokenThemes: safeTranscript ? ["personal reflection"] : [],
    spokenEmotions: [],
    visualAffectSignals: previousDerivedEmotionalContext?.visualAffectSignals || [],
    signalTensions: previousDerivedEmotionalContext?.signalTensions || [],
    symbolicElements: safeTranscript ? ["open path"] : [],
    sceneConcept: "A symbolic scene shaped by the reflection.",
    atmosphere: "Quiet, reflective, and emotionally gentle.",
    composition: "Balanced square composition with one central focal path.",
  };

  return fallback;
}

function createBackupImageDataUrl(sceneConcept: string): string {
  const safeText = sceneConcept.slice(0, 160).replace(/[<>&]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="#fffaf2"/><rect x="104" y="104" width="816" height="816" rx="32" fill="#f5efe5" stroke="#ded0bd" stroke-width="10"/><path d="M206 662c126-158 264-135 350-35 80 94 178 78 260-47" stroke="#8c6555" stroke-width="18" fill="none" stroke-linecap="round"/><path d="M418 344c0-92-136-98-152-16-13 67 76 108 122 54 65-77-35-178-125-137-101 46-85 194 21 223 74 20 139-11 190-56" stroke="#6f7f87" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M474 410c66-51 126-56 191-17" stroke="#2c2925" stroke-width="10" fill="none" stroke-linecap="round"/><text x="512" y="814" text-anchor="middle" font-family="Georgia, serif" font-size="32" fill="#2c2925">Local visual companion</text><text x="512" y="866" text-anchor="middle" font-family="ui-sans-serif, system-ui" font-size="24" fill="#756f68">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function HomePage() {
  const [session, setSession] = useState<SessionState>(INITIAL_SESSION_STATE);

  const nextStage = useMemo(() => NEXT_STAGE_LABEL[session.stage], [session.stage]);

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.set("audio", audioBlob, "reflection.webm");

    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json()) as { transcript?: string; error?: string };
    if (!response.ok || !payload.transcript) {
      throw new Error(payload.error || "Transcription failed.");
    }
    return payload.transcript;
  }, []);

  const createMixedSignalBrief = useCallback(async (requestPayload: MixedSignalBriefRequest) => {
    const response = await fetch("/api/mixed-signal-brief", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(requestPayload),
    });
    const payload = (await response.json()) as MixedSignalBrief & { error?: string };
    if (!response.ok) {
      throw new Error(payload.error || "Mixed-signal brief failed.");
    }
    return payload;
  }, []);

  const requestCanvasImage = useCallback(async (mixedSignalBrief: MixedSignalBrief, modifier?: string) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      controller.abort();
    }, IMAGE_TIMEOUT_MS);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          mixedSignalBrief,
          modifier,
        }),
      });

      const payload = (await response.json()) as GenerateImageResponse;

      if (!response.ok || !payload.imageBase64 || !payload.prompt) {
        throw new Error(payload.error || "Image generation failed.");
      }

      return {
        imageBase64: payload.imageBase64,
        prompt: payload.prompt,
      };
    } finally {
      window.clearTimeout(timeout);
    }
  }, []);

  const runCanvasGeneration = useCallback(
    async ({
      transcript,
      modifier,
      frames,
      previousDerivedEmotionalContext,
      persistDerivedContext,
    }: {
      transcript: string;
      modifier?: string;
      frames?: string[];
      previousDerivedEmotionalContext?: DerivedEmotionalContext;
      persistDerivedContext: boolean;
    }) => {
      let mixedSignalBrief = fallbackBriefFromTranscript(
        transcript,
        previousDerivedEmotionalContext || null
      );
      let mixedSignalError = "";

      try {
        const responseBrief = await createMixedSignalBrief({
          transcript,
          frames,
          previousDerivedEmotionalContext,
        });
        mixedSignalBrief = applyDerivedContext(
          responseBrief,
          previousDerivedEmotionalContext || null
        );
      } catch {
        mixedSignalError =
          "Mixed-signal analysis is temporarily unavailable. Continuing with a local fallback brief.";
      }

      const derivedEmotionalContext =
        previousDerivedEmotionalContext || deriveEmotionalContextFromBrief(mixedSignalBrief);
      const promptFallback = buildImagePrompt(mixedSignalBrief, modifier);

      setSession((previous) => {
        if (
          previous.sampledFaceFrames.length === 0 &&
          previous.audioBlob === null &&
          previous.mediaStream === null
        ) {
          return previous;
        }

        return {
          ...previous,
          sampledFaceFrames: [],
          audioBlob: null,
          mediaStream: null,
        };
      });

      try {
        const imageResult = await requestCanvasImage(mixedSignalBrief, modifier);
        setSession((previous) => ({
          ...previous,
          stage: "result",
          transcript,
          stagedTranscript: transcript,
          mixedSignalBrief,
          derivedEmotionalContext: persistDerivedContext
            ? derivedEmotionalContext
            : previous.derivedEmotionalContext || derivedEmotionalContext,
          sampledFaceFrames: [],
          audioBlob: null,
          mediaStream: null,
          generatedImage: imageResult.imageBase64,
          generatedPrompt: imageResult.prompt,
          isLoading: false,
          errorMessage: mixedSignalError,
        }));
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Image generation failed.";
        const backupImage = createBackupImageDataUrl(mixedSignalBrief.sceneConcept);
        const composedError = [mixedSignalError, `${message} Showing a local backup image so the session can continue.`]
          .filter(Boolean)
          .join(" ");

        setSession((previous) => ({
          ...previous,
          stage: "result",
          transcript,
          stagedTranscript: transcript,
          mixedSignalBrief,
          derivedEmotionalContext: persistDerivedContext
            ? derivedEmotionalContext
            : previous.derivedEmotionalContext || derivedEmotionalContext,
          sampledFaceFrames: [],
          audioBlob: null,
          mediaStream: null,
          generatedImage: backupImage,
          generatedPrompt: promptFallback,
          isLoading: false,
          errorMessage: composedError,
        }));
      }
    },
    [createMixedSignalBrief, requestCanvasImage]
  );

  const createCanvasFromRecording = useCallback(async () => {
    const localTranscript = session.transcript.trim();
    const hasRecordedAudio = Boolean(session.audioBlob);
    if (!localTranscript && !hasRecordedAudio) {
      setSession((previous) => ({
        ...previous,
        errorMessage:
          "No reflection is available yet. Record audio, write the reflection, or use the sample to continue.",
      }));
      return;
    }

    setSession((previous) => ({
      ...previous,
      stage: "result",
      isLoading: true,
      errorMessage: "",
    }));

    let transcript = localTranscript;
    try {
      if (!transcript && session.audioBlob) {
        transcript = await transcribeAudio(session.audioBlob);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transcription failed.";
      setSession((previous) => ({
        ...previous,
        stage: "recording",
        isLoading: false,
        errorMessage: `${message} You can continue by writing the reflection or using the sample.`,
      }));
      return;
    }

    if (!transcript) {
      setSession((previous) => ({
        ...previous,
        stage: "recording",
        isLoading: false,
        errorMessage:
          "The reflection came through empty. Write it in manually or use the sample to continue.",
      }));
      return;
    }

    setSession((previous) => ({
      ...previous,
      transcript,
      stagedTranscript: transcript,
    }));

    const sampledFrames = session.sampledFaceFrames.slice(0, 5);

    await runCanvasGeneration({
      transcript,
      frames: sampledFrames.length > 0 ? sampledFrames : undefined,
      persistDerivedContext: true,
    });
  }, [runCanvasGeneration, session.audioBlob, session.sampledFaceFrames, session.transcript, transcribeAudio]);

  const handleRegenerateImage = useCallback(
    async (modifier?: string) => {
      if (!session.mixedSignalBrief) {
        setSession((previous) => ({
          ...previous,
          errorMessage: "No mixed-signal brief is available yet. Create a canvas first.",
        }));
        return;
      }

      setSession((previous) => ({
        ...previous,
        isLoading: true,
        errorMessage: "",
      }));

      const promptFallback = buildImagePrompt(session.mixedSignalBrief, modifier);

      try {
        const imageResult = await requestCanvasImage(session.mixedSignalBrief, modifier);
        setSession((previous) => ({
          ...previous,
          generatedImage: imageResult.imageBase64,
          generatedPrompt: imageResult.prompt,
          isLoading: false,
          errorMessage: "",
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Image generation failed.";
        const backupImage = createBackupImageDataUrl(session.mixedSignalBrief.sceneConcept);

        setSession((previous) => ({
          ...previous,
          generatedImage: backupImage,
          generatedPrompt: promptFallback,
          isLoading: false,
          errorMessage: `${message} Showing a local backup image so the session can continue.`,
        }));
      }
    },
    [requestCanvasImage, session.mixedSignalBrief]
  );

  const handleConfirmTranscriptEdit = useCallback(async () => {
    const transcript = session.stagedTranscript.trim();
    if (!transcript) {
      setSession((previous) => ({
        ...previous,
        errorMessage: "Edited reflection cannot be empty.",
      }));
      return;
    }

    if (transcript === session.transcript.trim()) {
      return;
    }

    const previousDerivedEmotionalContext =
      session.derivedEmotionalContext ||
      (session.mixedSignalBrief ? deriveEmotionalContextFromBrief(session.mixedSignalBrief) : undefined);

    setSession((previous) => ({
      ...previous,
      isLoading: true,
      errorMessage: "",
    }));

    await runCanvasGeneration({
      transcript,
      previousDerivedEmotionalContext,
      persistDerivedContext: false,
    });
  }, [runCanvasGeneration, session.derivedEmotionalContext, session.mixedSignalBrief, session.stagedTranscript, session.transcript]);

  const moveToNextStage = async () => {
    if (!nextStage) {
      return;
    }

    if (session.stage === "recording") {
      await createCanvasFromRecording();
      return;
    }

    if (!canTransition(session.stage, nextStage)) {
      setSession((previous) => ({
        ...previous,
        errorMessage: `Invalid transition from ${previous.stage} to ${nextStage}.`,
      }));
      return;
    }

    setSession((previous) => ({
      ...previous,
      stage: nextStage,
      errorMessage: "",
    }));
  };

  const resetSession = () => {
    setSession((previous) => resetSessionState(previous, "intro"));
  };

  const continueLabel =
    CONTINUE_LABEL_BY_STAGE[session.stage] || (nextStage ? `Continue to ${nextStage}` : "Flow complete");

  const handleAudioReady = useCallback((audioBlob: Blob | null) => {
    setSession((previous) => {
      if (previous.audioBlob === audioBlob) {
        return previous;
      }

      return {
        ...previous,
        audioBlob,
      };
    });
  }, []);

  const handleError = useCallback((message: string) => {
    setSession((previous) => {
      if (previous.errorMessage === message) {
        return previous;
      }

      return {
        ...previous,
        errorMessage: message,
      };
    });
  }, []);

  const handleStreamReady = useCallback((mediaStream: MediaStream | null) => {
    setSession((previous) => {
      if (previous.mediaStream === mediaStream) {
        return previous;
      }

      return {
        ...previous,
        mediaStream,
      };
    });
  }, []);

  const stageScreen = (() => {
    switch (session.stage) {
      case "intro":
      case "consent":
        return (
          <IntroConsentScreen
            continueLabel={continueLabel}
            onContinue={moveToNextStage}
            stage={session.stage}
          />
        );
      case "recording":
        return (
          <RecordingScreen
            continueLabel={continueLabel}
            onAudioReady={handleAudioReady}
            onContinue={() => {
              void moveToNextStage();
            }}
            onError={handleError}
            onFaceFramesReady={(frames) => {
              setSession((previous) => ({
                ...previous,
                sampledFaceFrames: frames,
              }));
            }}
            onLoadSampleTranscript={() => {
              setSession((previous) => ({
                ...previous,
                transcript: SAMPLE_TRANSCRIPT,
                stagedTranscript: SAMPLE_TRANSCRIPT,
                errorMessage: "",
              }));
            }}
            onStreamReady={handleStreamReady}
            onTranscriptInputChange={(value) => {
              setSession((previous) => ({
                ...previous,
                transcript: value,
                stagedTranscript: value,
              }));
            }}
            transcriptInputValue={session.transcript}
            isCreatingCanvas={session.isLoading}
          />
        );
      case "result":
        return (
          <ResultScreen
            errorMessage={session.errorMessage}
            generatedImage={session.generatedImage}
            generatedPrompt={session.generatedPrompt}
            isRegenerating={session.isLoading}
            mixedSignalBrief={session.mixedSignalBrief}
            onRegenerate={(modifier) => {
              void handleRegenerateImage(modifier);
            }}
            onReset={resetSession}
            transcript={session.transcript}
            stagedTranscript={session.stagedTranscript}
            onStageTranscriptEdit={(value) => {
              setSession((previous) => ({
                ...previous,
                stagedTranscript: value,
              }));
            }}
            onConfirmTranscriptEdit={() => {
              void handleConfirmTranscriptEdit();
            }}
            onDiscardTranscriptEdit={() => {
              setSession((previous) => ({
                ...previous,
                stagedTranscript: previous.transcript,
                errorMessage: "",
              }));
            }}
            canPreviewPrompt={process.env.NODE_ENV !== "production"}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <AppShell
      stage={session.stage}
      subtitle="Turn a short reflection into a quiet visual companion."
    >
      {stageScreen}

      {session.stage !== "result" ? <PrivacyResetButton onReset={resetSession} /> : null}

      {session.errorMessage && session.stage !== "result" ? (
        <p className="text-sm text-[color:var(--color-danger)]">{session.errorMessage}</p>
      ) : null}
    </AppShell>
  );
}
