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
- Auto-update check on launch.
- Signed update download/install and restart prompt.

## Updater channel

`develop` is the development source of truth. Production updates are only published from validated `main` releases.

validated main + manual Release dispatch -> GitHub Actions -> lint/build/Rust check -> Tauri NSIS build -> updater signature -> GitHub Release -> latest.json -> installed app check/download/install.

## Updater signing bootstrap

The updater public key is committed in `src-tauri/tauri.conf.json`. GitHub Actions stores the password-protected private key and password in `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` repository secrets.

Never commit or rotate the private key without an explicit updater-key migration plan. Losing it prevents future updates for existing installations.
