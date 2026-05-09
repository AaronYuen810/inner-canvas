"use client";

import { useCallback, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { GeneratingScreen } from "@/components/GeneratingScreen";
import { IntroConsentScreen } from "@/components/IntroConsentScreen";
import { PrivacyResetButton } from "@/components/PrivacyResetButton";
import { RecordingScreen } from "@/components/RecordingScreen";
import { ReflectionReviewScreen } from "@/components/ReflectionReviewScreen";
import { ResultScreen } from "@/components/ResultScreen";
import { buildImagePrompt } from "@/lib/promptBuilder";
import {
  AppStage,
  INITIAL_SESSION_STATE,
  ReflectionAnalysis,
  SessionState,
  canTransition,
  resetSessionState,
} from "@/lib/sessionState";
import { DEFAULT_VISIBLE_TONES } from "@/lib/visibleCue";

const NEXT_STAGE_LABEL: Record<AppStage, AppStage | null> = {
  intro: "consent",
  consent: "recording",
  recording: "review",
  review: "generating",
  generating: "result",
  result: null,
};

const SAMPLE_TRANSCRIPT =
  "I have been carrying a lot of pressure this week, but I also notice moments where I pause and breathe. I want to hold both the strain and a small sense of hope as I figure out what to do next.";

const IMAGE_TIMEOUT_MS = 20_000;

function fallbackAnalysisFromTranscript(transcript: string): ReflectionAnalysis {
  const safeTranscript = transcript.trim();

  return {
    summary: safeTranscript || "A short reflection was recorded.",
    themes: safeTranscript ? ["personal reflection"] : [],
    emotionalKeywords: [],
    metaphors: [],
    conflicts: [],
    visualSymbols: [],
    oneSentenceInterpretation:
      "This image reflects one possible visual interpretation of your reflection.",
  };
}

function createBackupImageDataUrl(oneSentenceInterpretation: string): string {
  const safeText = oneSentenceInterpretation.slice(0, 160).replace(/[<>&]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#18181b"/><stop offset="100%" stop-color="#334155"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#bg)"/><circle cx="512" cy="420" r="220" fill="#0f172a" opacity="0.45"/><path d="M180 760 C320 610 460 620 540 700 C640 790 760 780 860 660" stroke="#f4f4f5" stroke-width="10" fill="none" opacity="0.7"/><text x="512" y="870" text-anchor="middle" font-family="ui-sans-serif, system-ui" font-size="30" fill="#e4e4e7">Fallback visual interpretation</text><text x="512" y="920" text-anchor="middle" font-family="ui-sans-serif, system-ui" font-size="24" fill="#d4d4d8">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function HomePage() {
  const [session, setSession] = useState<SessionState>(INITIAL_SESSION_STATE);
  const [toneInput, setToneInput] = useState("");

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

  const analyzeReflection = useCallback(async (transcript: string): Promise<ReflectionAnalysis> => {
    const response = await fetch("/api/analyze-reflection", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    const payload = (await response.json()) as ReflectionAnalysis & { error?: string };
    if (!response.ok) {
      throw new Error(payload.error || "Analysis failed.");
    }
    return payload;
  }, []);

  const prepareReviewStage = useCallback(async () => {
    const localTranscript = session.transcript.trim();
    const hasRecordedAudio = Boolean(session.audioBlob);
    if (!localTranscript && !hasRecordedAudio) {
      setSession((previous) => ({
        ...previous,
        errorMessage:
          "No recorded audio is available. Add transcript text or load the sample transcript to continue.",
      }));
      return;
    }

    setSession((previous) => ({
      ...previous,
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
        isLoading: false,
        errorMessage:
          `${message} You can continue by entering text in transcript fallback mode or loading the sample transcript.`,
      }));
      return;
    }

    if (!transcript) {
      setSession((previous) => ({
        ...previous,
        isLoading: false,
        errorMessage:
          "Transcription is empty. Add transcript text or load the sample transcript to continue.",
      }));
      return;
    }

    let analysis = fallbackAnalysisFromTranscript(transcript);
    let reviewMessage = "";
    try {
      analysis = await analyzeReflection(transcript);
    } catch {
      reviewMessage =
        "Analysis is temporarily unavailable. Showing a fallback summary so you can continue the demo.";
    }

    setSession((previous) => ({
      ...previous,
      isLoading: false,
      stage: "review",
      transcript,
      reflectionAnalysis: analysis,
      visibleCueEstimate:
        previous.visibleCueEstimate.length > 0 ? previous.visibleCueEstimate : DEFAULT_VISIBLE_TONES,
      confirmedVisibleTone: [],
      errorMessage: reviewMessage,
    }));
  }, [analyzeReflection, session.audioBlob, session.transcript, transcribeAudio]);

  const moveToNextStage = async () => {
    if (!nextStage) {
      return;
    }

    if (session.stage === "recording") {
      await prepareReviewStage();
      return;
    }

    if (session.stage === "review" && session.confirmedVisibleTone.length === 0) {
      setSession((previous) => ({
        ...previous,
        errorMessage: "Confirm or edit the visible tone estimate before continuing.",
      }));
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
      visibleCueEstimate:
        nextStage === "review" && previous.visibleCueEstimate.length === 0
          ? DEFAULT_VISIBLE_TONES
          : previous.visibleCueEstimate,
      confirmedVisibleTone: nextStage === "review" ? [] : previous.confirmedVisibleTone,
      errorMessage: "",
    }));
  };

  const resetSession = () => {
    setToneInput("");
    setSession((previous) => resetSessionState(previous, "intro"));
  };

  const continueLabel = nextStage ? `Continue to ${nextStage}` : "Flow complete";

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

  const handleGenerateImage = useCallback(
    async (modifier?: string) => {
      setSession((previous) => ({
        ...previous,
        isLoading: true,
        errorMessage: "",
      }));

      const analysisPayload =
        session.reflectionAnalysis || fallbackAnalysisFromTranscript(session.transcript);
      const tonePayload =
        session.confirmedVisibleTone.length > 0
          ? session.confirmedVisibleTone
          : session.visibleCueEstimate;

      const promptFallback = buildImagePrompt(
        analysisPayload,
        tonePayload,
        undefined,
        modifier
      );
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
            analysis: analysisPayload,
            confirmedVisibleTone: tonePayload,
            modifier,
          }),
        });
        const payload = (await response.json()) as {
          imageBase64?: string;
          prompt?: string;
          error?: string;
        };

        if (!response.ok || !payload.imageBase64 || !payload.prompt) {
          throw new Error(payload.error || "Image generation failed.");
        }

        setSession((previous) => ({
          ...previous,
          reflectionAnalysis: previous.reflectionAnalysis || analysisPayload,
          confirmedVisibleTone:
            previous.confirmedVisibleTone.length > 0
              ? previous.confirmedVisibleTone
              : tonePayload,
          generatedImage: payload.imageBase64 || "",
          generatedPrompt: payload.prompt || "",
          errorMessage: "",
          isLoading: false,
          stage: "result",
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Image generation failed.";
        const backupImage = createBackupImageDataUrl(
          analysisPayload.oneSentenceInterpretation ||
            "One possible visual interpretation of your reflection."
        );

        setSession((previous) => ({
          ...previous,
          reflectionAnalysis: previous.reflectionAnalysis || analysisPayload,
          confirmedVisibleTone:
            previous.confirmedVisibleTone.length > 0
              ? previous.confirmedVisibleTone
              : tonePayload,
          generatedImage: backupImage,
          generatedPrompt: promptFallback,
          stage: "result",
          isLoading: false,
          errorMessage:
            `${message} Showing a local backup image so the demo can continue.`,
        }));
      } finally {
        window.clearTimeout(timeout);
      }
    },
    [session.confirmedVisibleTone, session.reflectionAnalysis, session.transcript, session.visibleCueEstimate]
  );

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
            onLoadSampleTranscript={() => {
              setSession((previous) => ({
                ...previous,
                transcript: SAMPLE_TRANSCRIPT,
                errorMessage: "",
              }));
            }}
            onStreamReady={handleStreamReady}
            onTranscriptInputChange={(value) => {
              setSession((previous) => ({
                ...previous,
                transcript: value,
              }));
            }}
            transcriptInputValue={session.transcript}
            isPreparingReview={session.isLoading}
          />
        );
      case "review":
        return (
          <ReflectionReviewScreen
            analysis={session.reflectionAnalysis}
            canContinue={session.confirmedVisibleTone.length > 0}
            continueLabel={continueLabel}
            mediaStream={session.mediaStream}
            onAddTone={(tone) => {
              const normalizedTone = tone.trim().toLowerCase();
              if (!normalizedTone) {
                return;
              }

              setSession((previous) => {
                if (previous.visibleCueEstimate.includes(normalizedTone)) {
                  return previous;
                }

                return {
                  ...previous,
                  visibleCueEstimate: [...previous.visibleCueEstimate, normalizedTone],
                  confirmedVisibleTone: [],
                };
              });
              setToneInput("");
            }}
            onApplyEstimatedTone={(tones) => {
              const normalizedTones = tones
                .map((tone) => tone.trim().toLowerCase())
                .filter(Boolean);

              setSession((previous) => ({
                ...previous,
                visibleCueEstimate:
                  normalizedTones.length > 0 ? normalizedTones : previous.visibleCueEstimate,
                confirmedVisibleTone: [],
              }));
            }}
            onConfirmVisibleTone={() => {
              setSession((previous) => ({
                ...previous,
                confirmedVisibleTone: [...previous.visibleCueEstimate],
              }));
            }}
            onContinue={() => {
              void moveToNextStage();
            }}
            onRemoveTone={(tone) => {
              setSession((previous) => ({
                ...previous,
                visibleCueEstimate: previous.visibleCueEstimate.filter((current) => current !== tone),
                confirmedVisibleTone: [],
              }));
            }}
            onToneInputChange={setToneInput}
            toneInputValue={toneInput}
            transcript={session.transcript}
            visibleTone={session.visibleCueEstimate}
          />
        );
      case "generating":
        return (
          <section className="space-y-4">
            <GeneratingScreen />
            <div className="flex">
              <button
                className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-60"
                disabled={session.isLoading}
                onClick={() => {
                  void handleGenerateImage();
                }}
                type="button"
              >
                {session.isLoading ? "Generating image..." : "Generate image"}
              </button>
            </div>
          </section>
        );
      case "result":
        return (
          <ResultScreen
            confirmedVisibleTone={session.confirmedVisibleTone}
            errorMessage={session.errorMessage}
            generatedImage={session.generatedImage}
            isRegenerating={session.isLoading}
            onRegenerate={(modifier) => {
              void handleGenerateImage(modifier);
            }}
            onReset={resetSession}
            generatedPrompt={session.generatedPrompt}
            canPreviewPrompt={process.env.NODE_ENV !== "production"}
            oneSentenceInterpretation={
              session.reflectionAnalysis?.oneSentenceInterpretation ||
              "This image reflects one possible visual interpretation of your reflection."
            }
            themes={session.reflectionAnalysis?.themes || []}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <AppShell subtitle="MVP flow with visible tone review and symbolic image generation.">
      <section className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Current stage</h2>
        <p className="mt-2 text-2xl font-semibold capitalize">{session.stage}</p>
      </section>

      {stageScreen}

      {session.stage !== "result" ? <PrivacyResetButton onReset={resetSession} /> : null}

      {session.errorMessage ? (
        <p className="text-sm text-rose-300">{session.errorMessage}</p>
      ) : null}
    </AppShell>
  );
}
