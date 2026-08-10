# Security Policy

Spark Desktop is a community-built Windows shell that loads Gemini Spark and selected Google Workspace pages inside Microsoft Edge WebView2.

## Supported versions

Only the latest published release is supported for security fixes. Users should keep automatic updates enabled and move to the newest signed release.

## Reporting a vulnerability

Please do **not** publish sensitive security details in a public issue.

Report vulnerabilities privately to the repository owner through GitHub's private security reporting features when available. Include:

- affected Spark Desktop version;
- Windows version;
- clear reproduction steps;
- expected vs. actual behavior;
- whether the issue affects the local shell, WebView isolation, updater, or Google session handling.

## Security boundaries

- Remote Gemini/Google webviews are not granted Spark Desktop native Tauri capabilities.
- The application does not attempt to extract Google credentials or authentication tokens.
- Google session state is stored by the WebView2 application profile used by Spark Desktop.
- Production updates are delivered through signed Tauri updater artifacts published in GitHub Releases.
- Updater private signing keys must never be committed to the repository.

## Third-party services

Gemini, Google Docs, Google Sheets, Google accounts, and their availability, authentication, privacy, and security behavior are controlled by Google and remain subject to Google's own terms and policies.
