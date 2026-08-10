# Security Policy

## Supported versions

Security fixes are applied to the latest published Spark Desktop version.

## Reporting a vulnerability

Do not disclose suspected vulnerabilities in a public issue or discussion. Use the repository's **Security** tab to submit a private vulnerability report through GitHub Security Advisories.

Include the affected version, Windows version, reproduction steps, expected and observed behavior, impact, and relevant logs or screenshots. Do not include Google credentials, cookies, session tokens, signing keys, or other secrets.

## Update trust

Official builds are published only through this repository's GitHub Releases. The Tauri updater verifies signed update artifacts. Private signing keys must remain in GitHub Actions Secrets and must never be committed or shared in issues.
