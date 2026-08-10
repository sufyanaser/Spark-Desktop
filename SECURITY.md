# Security Policy

Spark Desktop is a community-built Windows shell that loads Gemini Spark and selected Google Workspace pages inside Microsoft Edge WebView2.

## Supported versions

Only the latest published release is supported for security fixes. Users should keep automatic updates enabled and move to the newest signed release.

## Reporting a vulnerability

Do not publish sensitive security details in a public issue or discussion. Use the repository's **Security** tab to submit a private vulnerability report through GitHub Security Advisories.

Include:

- the affected Spark Desktop version;
- the Windows version;
- clear reproduction steps;
- expected and observed behavior;
- impact on the local shell, WebView isolation, updater, or Google session handling;
- sanitized logs or screenshots when useful.

Do not include Google credentials, cookies, session tokens, signing keys, or other secrets.

## Security boundaries

- Remote Gemini and Google webviews are not granted Spark Desktop native Tauri capabilities.
- The application does not attempt to extract Google credentials or authentication tokens.
- Google session state is stored by the WebView2 application profile used by Spark Desktop.
- Official builds and update metadata are published only through this repository's GitHub Releases.
- Production updates use signed Tauri updater artifacts.
- Private signing keys belong only in GitHub Actions Secrets and must never be committed or shared in issues.

## Third-party services

Gemini, Google Docs, Google Sheets, Google accounts, and their availability, authentication, privacy, and security behavior are controlled by Google and remain subject to Google's own terms and policies.
