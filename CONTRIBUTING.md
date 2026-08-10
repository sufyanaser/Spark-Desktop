# Contributing to Spark Desktop

Spark Desktop is intentionally a **focused desktop shell**, not a general-purpose browser. Contributions should preserve that boundary unless a broader direction is explicitly accepted.

## Before you start

- Read [README.md](README.md) for product scope.
- Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before changing WebView, window, updater, or permission behavior.
- Check [SUPPORT.md](SUPPORT.md) before filing a bug.
- Security issues must follow [SECURITY.md](SECURITY.md) rather than a public issue.

## Branch model

- `develop` — development source of truth.
- `main` — released state.
- feature/fix/chore work targets `develop`.
- release preparation promotes validated `develop` to `main`.

Example branch names:

```text
feature/session-restoration
fix/workspace-popup-routing
chore/repository-cleanup
```

## Engineering gates

Frontend/UI changes:

```bash
npm ci
npm run lint
npm run build
```

Native/runtime changes:

```bash
npm ci
npm run lint
npm run build
cd src-tauri
cargo check
```

The GitHub CI workflow is the final merge gate. Do not merge a known failing check.

## Pull requests

A strong PR should:

1. solve one coherent problem;
2. explain the workflow impact;
3. describe the implementation boundary;
4. include relevant validation;
5. avoid unrelated feature expansion;
6. target `develop` unless it is an explicit release PR.

## Product boundary

Good contributions usually improve:

- Spark tab/window workflow;
- Google Docs/Sheets continuity from Spark;
- native Windows lifecycle behavior;
- session persistence;
- reliability and isolation;
- updater/release behavior;
- focused desktop ergonomics.

Changes that add a general address bar, bookmarks, extension systems, broad arbitrary browsing, or a replacement Gemini UI require explicit product review before implementation.

## Privacy

Never include private account data, documents, prompts, personal information, or authentication material in issues, screenshots, fixtures, or commits.

## Trademark / affiliation

Do not present Spark Desktop as a Google product or use Google/Gemini logos as the project's own identity. Product names may be referenced only to describe interoperability and context.
