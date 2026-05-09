# Docs + config — improvements

Punch list for documentation and frontend config.

## Pending

### Docs

- **`docs/` is gitignored.** [`.gitignore:25-26`](../../.gitignore). All docs (this file included) are local-only — they don't travel with the repo. Decide whether to commit. Suggested compromise: commit conventions + feature docs, gitignore `docs/private/` for sensitive content. **Ask before changing.**
- **`.gitignore` typo: `ClAUDE.local.md`** ([`.gitignore:31`](../../.gitignore)). macOS case-insensitive FS still matches; Linux CI/Docker (case-sensitive) wouldn't, and `CLAUDE.local.md` could leak. One-line fix.
- **`README.md` has no setup instructions.** No `dev` command, no env-var prerequisites, no link to deeper docs. Add a "Quick start" section with `docker compose up` and links to setup + architecture docs.
- **No `.env.example` files.** Add `frontend/.env.example` and `backend/.env.example` with placeholders + comments. Reference both in a setup doc.
- **No central setup doc.** Setup info is fragmented across `features/checkout.md` (Stripe + Resend + webhook) and `features/places.md` (MaxMind + Google Places). Add `docs/setup/local-dev.md` that walks through everything in order; feature docs link to relevant sections rather than duplicate.
- **Missing feature docs.** Cart, products listing/filtering, PDP, navbar/dropdowns, landing, root layout. Write as a side effect of touching each area for the improvements work. (Collections is done; checkout, places already exist.)
- **CLAUDE-vs-docs duplication remains in spots.** `frontend/CLAUDE.md`'s data-fetching section overlaps with `docs/frontend/architecture/data-fetching.md`. CLAUDE files hold the rule; docs hold the rationale + examples. Audit the data-fetching content in `frontend/CLAUDE.md` and trim anything that's already explained in the architecture doc.

### Config

- **Mixed lockfiles + Dockerfile uses `npm`.** `frontend/package.json` declares `pnpm`, `pnpm-lock.yaml` exists but is gitignored, `package-lock.json` also exists, Dockerfile installs via `npm`. Reproducibility risk. Pick one (pnpm everywhere is the better hygiene); align Dockerfile + lockfile + gitignore.
- **TanStack devtools deps installed but not mounted.** `@tanstack/react-query-devtools`, `@tanstack/react-router-devtools` in `package.json` not imported in `main.tsx`. Either mount in dev (`import.meta.env.DEV && <ReactQueryDevtools />`) or remove from package.json.
- **Dockerfile doesn't pin `node:20-slim` minor version.** Resolves to whatever's latest at build time. Pin to a specific minor for reproducibility (matching `node --version` locally).

### Low severity
- **`vite.config.ts` alias is `@` only** — could split into `@api`/`@src`. Taste preference.
- **`tsconfig.json` `types` array not explicit** — defaults pull in DOM + Node implicitly. Functional but could be more explicit.
- **`index.html` `<title>` says "UrbanStems" twice.** Each route's loader sets `document.title` anyway, so this only shows pre-hydration. Minor.
- **`react`/`react-dom` pinned exactly while others use carets.** Defensible (React minors can introduce subtle behavior); worth a comment in the package or setup docs.

## CLAUDE-rule candidates

- **CLAUDE files hold the rule (≤ 5 lines per topic, with link to the deeper doc); `docs/frontend/architecture/` holds the full explanation with examples.** Don't duplicate the body of a convention across both files. Pending the deduplication pass.
- **Every env var lives in `.env.example` with a comment.** New env vars must be added to the example file in the same change. Pending the example files being added.
- **Name the chosen package manager + lockfile in the README's quick-start section.** Pending the npm-vs-pnpm resolution.
