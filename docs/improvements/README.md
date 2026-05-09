# Improvements

Punch lists of remaining work, organized by area. Not explanations — for those, see [`docs/frontend/`](../frontend/) and [`docs/backend/`](../backend/).

## Files

| File | Scope |
|---|---|
| [api.md](api.md) | `frontend/api/` — request layer, query factories, types |
| [routes.md](routes.md) | `frontend/routes/` — TanStack Router file routes |
| [src-commerce-shared.md](src-commerce-shared.md) | `frontend/src/{cart,checkout,address,date,common,navbar}/` |
| [src-browse.md](src-browse.md) | `frontend/src/{products,filters,landing}/` |
| [docs-and-config.md](docs-and-config.md) | `docs/`, `README.md`, `CLAUDE.md`, `CLAUDE.local.md`, frontend config |
| [dynamic-sizing.md](dynamic-sizing.md) | Cross-cutting responsive-design workstream |
| [backend.md](backend.md) | `backend/` — remaining + future + skipped |

## Format

Each entry is short:

```
**[short title]**
- Location: path/to/file.ts:lines (when relevant)
- One-line description of what's wrong + the fix.
```

When an item lands, **delete the entry**. Git captures the change; the new state lives in `features/` or `architecture/` docs.

## CLAUDE-rule promotion

CLAUDE-rule candidates are listed under each area's "CLAUDE-rule candidates" subsection. Promotion to `CLAUDE.md` / `CLAUDE.local.md` happens after:

1. The pattern is confirmed (multiple instances, or user agreement).
2. A short rule paragraph (≤ 5 lines) is drafted.
3. If the convention has examples/rationale that merit detail, a corresponding `docs/frontend/architecture/<topic>.md` is written and the CLAUDE rule links to it.

Until promoted, candidates stay here as living suggestions.
