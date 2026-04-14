# Flicky

A voice-driven, screen-aware AI companion that lives in the corner of your screen. Hold a hotkey, talk to it, and a little blue cursor flies across your display to point at whatever it's referring to.

> **Inspired by [Clicky](https://www.clicky.so/)** by [Farza](https://github.com/farzaa) ([github.com/farzaa/clicky](https://github.com/farzaa/clicky)).
> Clicky is the original idea — a macOS-only Swift app. Flicky is an independent reimagining built from scratch in Electron so the same experience can run on **Windows, macOS, and Linux**. All credit for the original concept, the pointing-cursor interaction, and the "vibe" goes to Farza. If you're on a Mac, go check out the original — it's great.

---

## What Flicky adds on top of the original idea

- **Cross-platform** — Windows, macOS, and Linux from a single Electron codebase.
- **A second reasoning provider** — pick between **Anthropic Claude** (Opus / Sonnet 4.6) and **OpenAI** (GPT-5, GPT-5 mini, GPT-4o) on the fly.
- **More ElevenLabs voices** — full voice catalog, plus per-voice speed and stability sliders.
- **Local chat history** — every conversation is stored on your machine, browsable from the panel, never uploaded.
- **Long-running context management** — auto-compacts older messages into a summary near a configurable token budget so a single conversation can run forever without blowing up the context window.
- **Customizable push-to-talk shortcut** — capture any key combination from the UI; the global shortcut re-registers live.
- **Three transcription options** — Groq Whisper Large v3 / v3 Turbo with one-click switching.
- **Multiple reasoning depths** — off / low / medium / high "extended thinking" toggle.
- **Multi-display aware overlay** — the blue cursor follows your real mouse across monitors.
- **Provider key management** — separate, encrypted local storage for each provider's API key with one-click validation.

The core loop — hold the hotkey, ask anything, see the blue cursor point — is faithful to Farza's original.

---

## Running locally

Requires [Bun](https://bun.sh) (or npm) and Node 20+.

```bash
bun install
bun run dev
```

That starts the TypeScript watcher for the main process and Vite for the renderer. Launch the Electron app from a separate terminal once the dev servers are up:

```bash
bun run start
```

## Building installers

```bash
bun run package          # current platform
bun run package:win      # Windows .exe (NSIS)
bun run package:mac      # macOS .dmg + .zip (universal)
bun run package:linux    # AppImage + .deb
```

Releases are also produced automatically by GitHub Actions on every `v*` tag — see [`.github/workflows/build.yml`](.github/workflows/build.yml).

## Configuration

You'll need API keys for the providers you want to use:

- **Anthropic** or **OpenAI** — reasoning
- **ElevenLabs** — text-to-speech
- **Groq** — speech-to-text

Add them in the panel under **Mind**, **Voice**, and **Ear**. Keys are stored locally with platform-appropriate encryption — they never leave your machine except in API calls to the relevant provider.

## License

MIT — see [LICENSE](LICENSE).

The original Clicky project is the intellectual seed for this work; Flicky is an independent implementation and does not bundle or redistribute Clicky's source. If you like what's here, please also star [Farza's repo](https://github.com/farzaa/clicky).
