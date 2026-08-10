# Spark Desktop — Architecture

## Product boundary

Spark Desktop is a minimal Windows shell for `https://gemini.google.com/spark`.
It is intentionally not a general-purpose browser.

## Runtime layout

- Tauri 2 native window.
- React shell occupies only the 40px top bar.
- Each tab is a child WebView2 webview below the top bar.
- Spark tabs intentionally use Tauri's default application WebView2 data store (no per-tab data-directory override). Phase 0 verifies that Google cookies/session persist across tabs, windows, and app restarts before release.
- New windows are additional shell windows and can host their own child Spark webviews.
- Remote Spark webviews are excluded from Tauri capabilities; only bundled shell webviews receive native permissions.

## MVP controls

- New tab.
- Close tab.
- New window.
- Dark/light shell theme.
- Ctrl+T / Ctrl+W / Ctrl+Tab / Ctrl+Shift+Tab / Ctrl+Shift+N / Ctrl+R, including while focus is inside Spark.
- Persistent tabs/theme.
- Auto-update check on launch.
- Signed update download/install and restart prompt.

## Updater channel

`develop` is the development source of truth. Production updates are only published from validated `main` releases.

validated main + manual Release dispatch -> GitHub Actions -> lint/build/Rust check -> Tauri NSIS build -> updater signature -> GitHub Release -> latest.json -> installed app check/download/install.

## Required manual bootstrap before first release

1. Generate a Tauri updater signing key pair locally.
2. Replace `REPLACE_WITH_TAURI_UPDATER_PUBLIC_KEY` in `src-tauri/tauri.conf.json` with the public key.
3. Add the private key to GitHub Actions secret `TAURI_SIGNING_PRIVATE_KEY`.
4. If the key has a password, add it to `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.

Never commit the private key.
