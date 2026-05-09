import React from "react";
type PrivacyResetButtonProps = {
  onReset: () => void;
};

export function PrivacyResetButton({ onReset }: PrivacyResetButtonProps) {
  return (
    <button
      className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100"
      onClick={onReset}
      type="button"
    >
      Reset / Delete session
    </button>
  );
}
