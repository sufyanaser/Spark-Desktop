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

## Updater signing bootstrap

The updater public key is committed in `src-tauri/tauri.conf.json`. GitHub Actions stores the password-protected private key and password in `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` repository secrets.

Never commit or rotate the private key without an explicit updater-key migration plan. Losing it prevents future updates for existing installations.
