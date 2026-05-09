import React from "react";
import { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  subtitle: string;
};

export function AppShell({ children, subtitle }: AppShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 p-8">
      <header className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">InnerCanvas</h1>
        <p className="max-w-2xl text-zinc-300">{subtitle}</p>
      </header>
      {children}
    </main>
  );
}
