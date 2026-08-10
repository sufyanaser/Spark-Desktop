# Spark Desktop

A minimal Windows desktop shell for **Gemini Spark** with native tabs, multi-window support, persistent Google session state, dark/light shell themes, and signed GitHub-native automatic updates.

[![Latest release](https://img.shields.io/github/v/release/sufyanaser/Spark-Desktop?display_name=tag&sort=semver&label=release&color=2563eb)](https://github.com/sufyanaser/Spark-Desktop/releases/latest)
[![CI](https://github.com/sufyanaser/Spark-Desktop/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/sufyanaser/Spark-Desktop/actions/workflows/ci.yml)
![Windows](https://img.shields.io/badge/platform-Windows-0f172a)
![Tauri](https://img.shields.io/badge/Tauri-v2-24c8db)

**[Download the latest signed Windows release](https://github.com/sufyanaser/Spark-Desktop/releases/latest)**

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

## Install on Windows

1. Open the [latest GitHub Release](https://github.com/sufyanaser/Spark-Desktop/releases/latest).
2. Download `Spark.Desktop_<version>_x64-setup.exe`.
3. Run the installer and launch **Spark Desktop**.

The Release also publishes the updater signature and `latest.json`. Installed copies verify signed updates before applying them. Spark Desktop is currently verified on 64-bit Windows with Microsoft Edge WebView2.

## Stack

- Tauri 2
- React + TypeScript + Vite
- Microsoft Edge WebView2 on Windows
- Tauri Updater + GitHub Releases

## Development

```bash
npm ci
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

## Privacy and security

- Spark Desktop opens the official Gemini Spark website; it does not replace or proxy Gemini.
- Google session data is stored in the local WebView2 profile used by the application.
- The application does not implement its own telemetry, account system, browsing history, or cloud synchronization.
- Only install builds from this repository's [Releases](https://github.com/sufyanaser/Spark-Desktop/releases) page.
- Report suspected vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## Support and contributing

- Use the bug form for reproducible product failures.
- Use the feature form for changes that remain inside the intentionally narrow product scope.
- Development changes target `develop`; release promotion to `main` happens only after validation.
- See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Current status

The signed Windows release pipeline is configured for automatic publishing from validated `main` releases, and installed copies use the GitHub Releases updater channel automatically on launch.
