# Spark Desktop

A minimal Windows desktop shell for **Gemini Spark** with native tabs, multi-window support, persistent Google session state, dark/light shell themes, and signed GitHub-native auto updates.

## Scope

Spark Desktop intentionally stays small:

- Opens `https://gemini.google.com/spark` directly.
- Multiple Spark tabs inside one desktop window.
- Additional Spark windows.
- Shared persistent WebView2 profile.
- Dark / light application chrome.
- Keyboard shortcuts.
- Signed automatic updates through GitHub Releases.

It is **not** a general-purpose browser: no address bar, bookmarks, history manager, extensions, or custom Gemini UI.

## Stack

- Tauri 2
- React + TypeScript + Vite
- Microsoft Edge WebView2 on Windows
- Tauri Updater + GitHub Releases

## Development

```bash
npm install
npm run lint
npm run build
npm run tauri dev
```

## Branch model

- `develop`: development source of truth.
- `main`: released state.
- features/fixes merge to `develop` after CI.
- release preparation merges `develop` to `main` only after validation.

## Auto-update

The installed application checks the latest GitHub Release on launch. A release from `main` is built by GitHub Actions, signed with the Tauri updater key, and published with updater metadata.

Before the first production release, configure the updater public key and GitHub Actions signing secrets as documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Current status

Implementation is ready for repository bootstrap and Windows/Gemini compatibility validation. The first production release is intentionally blocked until the updater signing key is configured and Google login/Spark behavior is verified inside WebView2 on Windows.
