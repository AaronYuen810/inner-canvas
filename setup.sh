#!/usr/bin/env bash
set -euo pipefail

echo "Running Codex setup for inner-canvas..."

ENV_SRC="$HOME/.config/codex-envs/inner-canvas/.env.local"

if [[ -f "$ENV_SRC" ]]; then
  cp "$ENV_SRC" .env.local
  chmod 600 .env.local
  echo "Copied .env.local"
else
  echo "Warning: no .env.local found at $ENV_SRC"
fi

if [[ -f "pnpm-lock.yaml" ]]; then
  pnpm install
elif [[ -f "package-lock.json" ]]; then
  npm install
elif [[ -f "yarn.lock" ]]; then
  yarn install
else
  echo "No JS lockfile found; skipping dependency install"
fi

echo "Setup complete."