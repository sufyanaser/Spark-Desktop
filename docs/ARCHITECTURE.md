# Spark Desktop — Architecture

## Product boundary

Spark Desktop is a minimal Windows shell for `https://gemini.google.com/spark`.
It is intentionally not a general-purpose browser.

## Runtime layout

- Tauri 2 native window.
- React shell occupies only the 40px top bar.
- Each tab is a child WebView2 webview below the top bar.
- Child tab webviews are created by the Rust host so native WebView2 new-window requests can be intercepted before Windows opens an external browser.
- Spark tabs intentionally use Tauri's default application WebView2 data store (no per-tab data-directory override), preserving a shared Google session across tabs and shell windows.
- Google Docs and Sheets links opened by Spark are routed into new internal tabs in the same Spark Desktop window instead of Chrome or another external browser.
- New shell windows can host their own child webviews while sharing the same application session store.
- Remote content webviews are excluded from Tauri capabilities; only bundled shell webviews receive native permissions.

## Native window controls

The frameless shell delegates minimize, maximize/restore, close, and drag operations to validated Rust commands. This avoids interaction conflicts between the custom title bar and Tauri drag regions while keeping remote content isolated from native window control APIs.

## MVP controls

- New Spark tab.
- Close tab.
- New window.
- Internal Google Docs / Sheets tabs opened from Spark.
- Native minimize / maximize / close controls.
- Drag-to-move frameless window and double-click title-bar maximize/restore.
- Dark/light shell theme.
- Ctrl+T / Ctrl+W / Ctrl+Tab / Ctrl+Shift+Tab / Ctrl+Shift+N / Ctrl+R, including while focus is inside Spark.
- Persistent tabs, URLs, and theme.
- Automatic update check on launch.
- Automatic signed update download and installation when a newer version is available.

## Updater channel

`develop` is the development source of truth. `main` is the released state.

Completed engineering work is validated on `develop`. When a release is ready, the version is incremented and validated `develop` is promoted to `main`. A push to `main` automatically starts the signed Release workflow:

`develop green -> version bump -> main -> GitHub Actions -> lint/build/Rust check -> signed Tauri NSIS release -> GitHub Release -> latest.json -> installed app checks on launch -> automatic download/install`.

The installed application does not require the user to download validation installers for routine updates. Validation artifacts are CI-only diagnostics. Production updates are delivered through the signed GitHub Releases updater channel.

On Windows, Tauri's updater installation step exits the running application as part of the installer flow. Spark Desktop requests relaunch after installation when execution returns from the updater API.

## Updater signing bootstrap

The updater public key is committed in `src-tauri/tauri.conf.json`. GitHub Actions stores the password-protected private key and password in `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` repository secrets.

Never commit or rotate the private key without an explicit updater-key migration plan. Losing it prevents future updates for existing installations.
