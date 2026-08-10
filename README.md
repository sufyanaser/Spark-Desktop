# Spark Desktop

A minimal Windows desktop shell for **Gemini Spark** with native tabs, multi-window support, persistent Google session state, dark/light shell themes, and signed GitHub-native automatic updates.

## Scope

Spark Desktop intentionally stays small:

- Opens `https://gemini.google.com/spark` directly.
- Multiple Spark tabs inside one desktop window.
- Additional Spark windows.
- Shared persistent WebView2 profile.
- Google Docs and Sheets opened by Spark stay inside Spark Desktop tabs.
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
- validated release preparation merges `develop` to `main`.

## Auto-update

Every completed release promoted to `main` is published automatically by GitHub Actions as a signed GitHub Release with updater metadata. Installed copies check the latest release on launch; when a newer signed version exists, Spark Desktop downloads and installs it automatically without requiring a separate installer download from the user.

On Windows the passive updater may briefly show installer progress while applying the signed update. The application then exits/relaunches as required by the Windows updater flow.

The updater public key and GitHub Actions signing secrets are configured. Keep the private signing key backed up securely; losing it prevents future trusted updates for installed copies.

## Current status

The signed Windows release pipeline is configured for automatic publishing from validated `main` releases, and installed copies use the GitHub Releases updater channel automatically on launch.
