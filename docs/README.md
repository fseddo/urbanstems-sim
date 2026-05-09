# Docs

Organized so an agent (or contributor) can pull in only the docs relevant to the area they're touching, rather than scanning everything. Think of this directory like a RESTful API — you reference the resource you need, not the whole catalog.

## Layout

```
docs/
  frontend/
    architecture/   # cross-cutting frontend principles (rarely change)
                    # — read these once when starting frontend work
    features/       # per-area state of the app — one doc per feature
                    # — read the relevant one when working in that area
  backend/
    architecture.md
    features/       # one doc per backend app
  improvements/     # remaining work, organized by area
                    # — punch lists, not explanations
```

## Reading order, by task

- **Touching the collection / listing page** → [`frontend/features/collections.md`](frontend/features/collections.md).
- **Touching the navbar / search / mobile menu** → `frontend/features/navbar.md` (TBD; write as a side effect when next touched).
- **Touching checkout** → [`frontend/features/checkout.md`](frontend/features/checkout.md).
- **Touching the address picker / geo / Google Places** → [`frontend/features/places.md`](frontend/features/places.md).
- **Touching the API layer / queries / mutations** → [`frontend/architecture/data-fetching.md`](frontend/architecture/data-fetching.md).
- **Adding responsive behavior** → [`frontend/architecture/dynamic-sizing.md`](frontend/architecture/dynamic-sizing.md), then the relevant `features/<area>.md` for area-specific token + breakpoint specifics.
- **Adding a backend feature / model / endpoint** → [`backend/architecture.md`](backend/architecture.md) + the relevant [`backend/features/<area>.md`](backend/features/).

## Principles for keeping docs useful

These docs persist design decisions across sessions — they're as much for the agent as for the human. Two failure modes to avoid:

1. **Doc grows past its usefulness threshold.** A 300-line doc costs almost as much to read as the source files it describes. Split aggressively into per-feature docs; keep architecture docs short and example-driven, not exhaustive.
2. **Same fact lives in three docs.** Drift is inevitable; the reader has no way to know which version is current. Each fact should live in exactly one doc — improvements references features, features reference architecture, but no doc duplicates content from another.

### What goes where

- **`features/<area>.md`** — *current* state of one feature: components, tokens, breakpoints, state shape, data flow. Updated when the feature changes. Self-contained — a contributor reading just this doc should be able to work in the area.
- **`architecture/<topic>.md`** — *cross-cutting* principles that aren't owned by one feature: how to do responsive sizing, how to do data fetching, how to use view transitions. Stable; rarely needs editing. Examples reference features but don't duplicate their detail.
- **`improvements/<topic>.md`** — *punch lists* of what's left to do. 1–3 lines per item: location, fix, severity. **No prose explaining how things work** (that's features/architecture). When an item lands, delete the entry — git has the history; the new state lives in features/.

### Triage rule for audit / improvement docs

Three categories of content typically live in audit docs. They get split:
- **Resolved** ✅ → delete. Git captures it.
- **Pattern observation** ("this is the canonical shape, let's preserve it") → promote into the relevant `architecture/` or `features/` doc.
- **Pending fix** or **future CLAUDE rule candidate** → stay in `improvements/`, as a thin one-liner.

If an audit doc accumulates resolved items + pattern docs + pending items in one file, it's failing this rule and should be split.
