# `frontend/api/` — improvements

Punch list for the API layer. For how the layer is shaped today, see [`docs/frontend/architecture/data-fetching.md`](../frontend/architecture/data-fetching.md).

## Pending

_All audit-cycle fixes have landed. Items below are future-facing._

### CLAUDE-rule candidates

- **`console.error`/`console.log` must be DEV-gated.** `request.ts` is gated; pin the rule once a second instance lands.
