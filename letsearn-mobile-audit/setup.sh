#!/usr/bin/env bash
# One-time setup for the LetsEarn mobile audit kit (macOS / Linux).
# Installs Node.js 20+, adb, and Claude Code if missing, then checks for a connected device.
set -euo pipefail

ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; exit 1; }

OS="$(uname -s)"
has() { command -v "$1" >/dev/null 2>&1; }

need_brew() {
  has brew || fail "Homebrew is required on macOS: https://brew.sh (install it, then re-run this script)"
}

echo "1/4 Node.js 20+"
node_major() { node -v 2>/dev/null | sed 's/^v\([0-9]*\).*/\1/'; }
if ! has node || [ "$(node_major)" -lt 20 ]; then
  if [ "$OS" = "Darwin" ]; then need_brew; brew install node
  else fail "Install Node.js 20+ from https://nodejs.org (or your package manager), then re-run"; fi
fi
ok "node $(node -v)"

echo "2/4 adb (Android platform-tools)"
if ! has adb; then
  if [ "$OS" = "Darwin" ]; then need_brew; brew install --cask android-platform-tools
  elif has apt-get; then sudo apt-get install -y adb
  else fail "Install Android platform-tools: https://developer.android.com/tools/releases/platform-tools"; fi
fi
ok "$(adb version | head -1)"

echo "3/4 Claude Code"
if ! has claude; then npm install -g @anthropic-ai/claude-code; fi
ok "claude $(claude --version 2>/dev/null || echo installed)"

echo "4/4 Connected device"
adb start-server >/dev/null 2>&1 || true
devices="$(adb devices | sed '1d' | grep -v '^\s*$' || true)"
if [ -z "$devices" ]; then
  warn "No device found. Plug in your Android phone (Developer options → USB debugging ON) or start an emulator, then run: adb devices"
elif echo "$devices" | grep -q unauthorized; then
  warn "Phone is connected but unauthorized. Unlock it and tap 'Allow USB debugging', then run: adb devices"
else
  ok "device ready: $(echo "$devices" | head -1 | awk '{print $1}')"
fi

echo
echo "Done. Next:"
echo "  cd \"$(cd "$(dirname "$0")" && pwd)\" && claude"
echo "  Approve the 'mobile' MCP server when asked, log into LetsEarn on the phone, then type /signup-audit"
