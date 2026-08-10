# Gemini Spark on Desktop — Product & Integration Findings

Spark Desktop is an independent, community-built experiment focused on one question:

> What would a focused Windows desktop workflow for Gemini Spark look like if the web product were wrapped in a minimal native shell instead of a general-purpose browser?

This document records product and integration findings from building and testing that shell. It is intended as constructive technical feedback for developers, product teams, and the Gemini community.

## 1. A focused desktop shell changes the workflow

Gemini Spark already provides the intelligence and web experience. The useful desktop layer is therefore not a replacement UI; it is a small amount of operating-system integration around the existing product.

The most valuable shell responsibilities have been:

- persistent signed-in sessions;
- multiple focused Spark tabs;
- additional native windows;
- keyboard-first tab management;
- native window movement and controls;
- in-app routing for related Google Workspace documents;
- automatic signed desktop updates.

The design becomes worse when it starts behaving like a full browser. An address bar, bookmarks, extensions, history UI, and unrelated navigation add complexity without improving the core Spark workflow.

## 2. Google Workspace continuity matters

Spark can produce or open Google Docs and Google Sheets as part of a workflow. Sending those documents to a separate browser interrupts the desktop context.

Spark Desktop therefore treats Docs and Sheets opened from Spark as part of the same workspace and routes them into internal tabs.

This exposed an important integration lesson: modern Google Workspace applications can rely on normal browser popup/window semantics during startup. A desktop webview host cannot safely assume that every `window.open()` can be denied and reconstructed as a URL-only navigation without side effects.

The current implementation therefore keeps the routing policy narrow and preserves Google Workspace runtime behavior as much as possible.

## 3. WebView popup handling is product behavior, not only plumbing

A WebView host makes product decisions whenever it intercepts navigation:

- Which destinations belong inside the app?
- Which should stay with the originating web application?
- Which should be delegated externally?
- What browser semantics does the target application expect?

For Spark Desktop, the useful boundary is intentionally small:

- Gemini Spark stays in-app.
- Google Docs and Sheets opened from Spark stay in-app.
- Spark Desktop does not try to become a general web browser.

## 4. Shared session state is essential

Separate tabs and windows are only useful if the Google session behaves consistently. Spark Desktop therefore uses the application's shared WebView2 data store instead of creating isolated per-tab profiles.

The shell does not extract Google credentials or tokens. Authentication remains inside Google's own web experience and the WebView2 profile that hosts it.

## 5. Native chrome should remain minimal

A 40px native top bar is enough to provide:

- tab switching;
- new tab;
- new window;
- minimize / maximize / close;
- drag-to-move;
- update status when needed.

The underlying Spark UI remains Google's UI. This keeps the project focused and avoids reimplementing Gemini features.

## 6. Automatic updates are part of the desktop experience

A lightweight wrapper becomes frustrating if every fix requires users to download a new installer manually.

Spark Desktop uses signed Tauri updater artifacts published through GitHub Releases. Installed copies check the release channel and apply newer trusted builds automatically.

This makes rapid compatibility fixes practical when Gemini, Google Workspace, WebView2, or the shell itself changes.

## 7. Current technical boundaries

Spark Desktop is deliberately conservative:

- Windows first.
- Microsoft Edge WebView2.
- No custom Gemini API implementation.
- No extraction of private Google data.
- No attempt to bypass Google authentication or security controls.
- No browser extension model.
- No claim of Google affiliation or endorsement.

## 8. Product opportunities suggested by the prototype

The prototype suggests several capabilities that could be useful in a first-party desktop experience:

1. Native multi-tab Spark workspaces.
2. Persistent project/session restoration.
3. First-class handoff between Spark and Docs/Sheets without leaving the desktop context.
4. Native keyboard navigation across Spark workspaces.
5. Clear rules for opening related Google surfaces inside the same desktop task.
6. Lightweight desktop update and lifecycle behavior without exposing browser complexity.

## 9. What would be useful to learn from Google / the community

The project would benefit from guidance or discussion around:

- recommended embedding behavior for Gemini web surfaces in desktop WebView hosts;
- expected popup/navigation behavior when Gemini opens Google Workspace content;
- any preferred integration boundaries for independent desktop shells;
- compatibility considerations that third-party WebView hosts should avoid breaking.

## 10. Project position

Spark Desktop is not a Google product and is not affiliated with, endorsed by, or sponsored by Google.

"Google", "Gemini", "Gemini Spark", "Google Docs", and "Google Sheets" are referenced only to describe interoperability with the corresponding Google products and services. All related trademarks belong to their respective owners.
