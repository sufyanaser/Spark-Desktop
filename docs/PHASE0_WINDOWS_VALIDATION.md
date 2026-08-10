# Phase 0 — Windows Compatibility Gate

Before publishing v0.1.0, validate on a real Windows machine:

1. Launch Spark Desktop.
2. Confirm `https://gemini.google.com/spark` loads inside the child WebView2.
3. Sign in to Google if needed.
4. Close and reopen the app.
5. Confirm the authenticated session persists.
6. Open 3 tabs and confirm each can use Spark independently.
7. Open a new window and confirm the same Google account/session is available.
8. Switch tabs repeatedly and resize/maximize the window.
9. Confirm the top bar never overlaps the Spark content.
10. Confirm the app shell has no access exposed to the remote Spark page.

Release v0.1.0 only if all items pass.
