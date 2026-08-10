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

The installed application checks the latest GitHub Release on launch. After Windows compatibility validation, a release is dispatched manually from `main`, built by GitHub Actions, signed with the Tauri updater key, and published with updater metadata.

The updater public key and GitHub Actions signing secrets are configured. Keep the private signing key backed up securely; losing it prevents future updates for installed copies.

## Current status

The signed Windows release pipeline is configured. Production releases remain manually dispatched from validated `main` after Windows/Gemini compatibility verification.
