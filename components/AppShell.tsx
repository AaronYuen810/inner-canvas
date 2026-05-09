import React from "react";
import { ReactNode } from "react";

import type { AppStage } from "@/lib/sessionState";

type AppShellProps = {
  children: ReactNode;
  stage: AppStage;
  subtitle: string;
};

type StepContext = {
  label: "Reflect" | "Canvas";
  stages: AppStage[];
};

const STEP_CONTEXT: StepContext[] = [
  { label: "Reflect", stages: ["recording"] },
  { label: "Canvas", stages: ["result"] },
];

function getActiveStep(stage: AppStage): string {
  return STEP_CONTEXT.find((step) => step.stages.includes(stage))?.label || "Reflect";
}

function InnerCanvasLogo() {
  return (
    <svg
      aria-hidden="true"
      className="h-12 w-12 flex-none"
      fill="none"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect height="30" rx="4" stroke="var(--color-border)" strokeWidth="2" width="28" x="14" y="10" />
      <path
        d="M16 31c5-7 12-5 15-1 2.8 3.7 6.1 2.9 9-1.4"
        stroke="var(--color-accent)"
        strokeLinecap="round"
        strokeWidth="2.8"
      />
      <path
        d="M18.5 22.8c0-5.2-7.7-5.5-8.6-.9-.7 3.8 4.3 6 6.9 3 3.7-4.3-2-10-7.1-7.7-5.7 2.5-4.8 11 1.2 12.6 4.2 1.1 7.8-.6 10.7-3.1"
        stroke="var(--color-blue-gray)"
        strokeLinecap="round"
        strokeWidth="2.4"
      />
      <path
        d="M22 25.8c3.6-2.8 6.9-3.1 10.5-1"
        stroke="var(--color-ink)"
        strokeLinecap="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

export function AppShell({ children, stage, subtitle }: AppShellProps) {
  const activeStep = getActiveStep(stage);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-7 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-[color:var(--color-border)] pb-6 md:flex-row md:items-end md:justify-between">
        <div className="flex max-w-3xl items-start gap-4">
          <InnerCanvasLogo />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-blue-gray)]">
              Private journal canvas
            </p>
            <h1 className="font-serif text-4xl font-semibold leading-tight text-[color:var(--color-ink)] sm:text-5xl">
              InnerCanvas
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--color-muted)] sm:text-base">
              {subtitle}
            </p>
          </div>
        </div>

        <nav aria-label="Reflection progress" className="flex flex-wrap items-center gap-2 text-sm">
          {STEP_CONTEXT.map((step, index) => {
            const isActive = step.label === activeStep;
            return (
              <React.Fragment key={step.label}>
                {index > 0 ? (
                  <span aria-hidden="true" className="text-[color:var(--color-muted)]">
                    →
                  </span>
                ) : null}
                <span
                  aria-current={isActive ? "step" : undefined}
                  className={
                    isActive
                      ? "rounded-full border border-[color:var(--color-accent)] bg-[rgb(140_101_85_/_0.1)] px-3 py-1 font-semibold text-[color:var(--color-ink)]"
                      : "px-1 py-1 text-[color:var(--color-muted)]"
                  }
                >
                  {step.label}
                </span>
              </React.Fragment>
            );
          })}
        </nav>
      </header>

      {children}

      <p className="pb-2 text-xs text-[color:var(--color-muted)]">
        Session-only. No account or saved history. Start over clears this entry.
      </p>
    </main>
  );
}
