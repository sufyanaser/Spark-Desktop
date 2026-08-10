# Contributing / Execution Gates

1. Branch from `develop`.
2. Implement one coherent change.
3. Run `npm run lint`.
4. Run `npm run build`.
5. Run `cargo check` in `src-tauri`.
6. Do not merge if any gate fails.
7. Feature/fix PRs target `develop`.
8. Release preparation targets `main` only after `develop` is green and version metadata is consistent.
