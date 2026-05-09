import React from "react";
import { Trash2 } from "lucide-react";

type PrivacyResetButtonProps = {
  onReset: () => void;
};

export function PrivacyResetButton({ onReset }: PrivacyResetButtonProps) {
  return (
    <button
      className="journal-button-danger self-start"
      onClick={onReset}
      type="button"
    >
      <Trash2 aria-hidden="true" size={16} />
      Start over / delete session
    </button>
  );
}
