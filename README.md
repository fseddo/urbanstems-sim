# UrbanStems Sim

A from-scratch web reconstruction of the [UrbanStems](https://urbanstems.com) floral e-commerce experience — Django + React, Postgres-backed, Stripe-wired, deployable via Docker. Built as a learning sandbox for production-shape patterns rather than a 1:1 functional clone.

The catalog is seeded from a real scrape of UrbanStems' product data (`backend/data/products.json` + `addons.json`); the visual design closely tracks the original; the architectural choices (taxonomy system, payment intents, address autocomplete, configurator add-ons, dynamic responsive sizing tokens) were all included deliberately to practice patterns that show up on bigger teams.

## Tech stack

**Backend** ([`backend/`](backend/))

- Python 3.11 / Django 5.0 / Django REST Framework + django-filter
- PostgreSQL 15
- Redis (idempotency cache for the Stripe webhook)
- Stripe (PaymentIntent + Elements)
- Resend (transactional email)
- whitenoise (static), gunicorn (prod)

**Frontend** ([`frontend/`](frontend/))

- React 19 + TypeScript + Vite 6
- TanStack Router (file-based routes) + TanStack Query (server state) + TanStack Virtual (the catalog grid)
- Jotai (cross-tree client state — cart, navbar, address, addons)
- Tailwind 4
- Stripe Elements

**Infra**

- Docker Compose (Postgres + Django + Vite for local dev; same images for prod)

## Repo layout

```
backend/                   # Django project + REST API
  products/                # catalog, facets/tags taxonomy, reviews, seed
  checkout/                # Stripe PaymentIntent, webhook, order email
  places/                  # Google Places proxy with throttling
  data/                    # scraped product + addon JSON (seed input)
  manage.py
frontend/
  api/                     # TanStack Query queryOptions, types
  routes/                  # file-based TanStack Router routes
  src/
    landing/               # / route components
    collections/           # /collections/<slug> + filtering
    products/              # /products/<slug> PDP
    cart/                  # cart pane + atoms
    checkout/              # /checkout flow + summary
    addons/                # vase + gift selector pane + atoms
    navbar/                # navbar, dropdowns, mobile menu, search
    address/               # address picker
    date/                  # date picker (delivery)
    filters/               # filter sidebar + URL search-params
    common/                # shared components, hooks, utils
docs/                      # area-scoped feature + architecture docs
docker-compose.yml
```

## Running locally

Requires Docker + Docker Compose.

```bash
# Start everything (Postgres + Django + Vite frontend)
docker compose up

# Reseed the catalog + add-ons after editing data files
docker compose exec web python manage.py seed_products --clear
# or, from backend/:
pnpm run reseed
```

Once up:

- Frontend at <http://localhost:3000>
- Backend API at <http://localhost:8000/api>
- Postgres at `localhost:5432`

For Stripe / Resend / Google Places to actually work, set the corresponding env vars in `backend/.env` and `frontend/.env` (see [`docs/frontend/features/checkout.md`](docs/frontend/features/checkout.md) and [`docs/frontend/features/places.md`](docs/frontend/features/places.md) for setup details).

## Where to read

[`docs/`](docs/) is organized for selective reading. Start with [`docs/README.md`](docs/README.md) for the routing table.

- Repo-wide rules + the area routing table → [`CLAUDE.md`](CLAUDE.md)
- Frontend-specific rules → [`frontend/CLAUDE.md`](frontend/CLAUDE.md)
- Backend-specific rules → [`backend/CLAUDE.md`](backend/CLAUDE.md)

Per-feature deep dives live under [`docs/frontend/features/`](docs/frontend/features/) and [`docs/backend/features/`](docs/backend/features/); cross-cutting principles (responsive sizing, data fetching, forms, styling) under [`docs/frontend/architecture/`](docs/frontend/architecture/).

## Ethical use & disclaimer

This project is for **personal, educational, and prototyping purposes only**. It is **not affiliated with or endorsed by UrbanStems**. Product data scraped from urbanstems.com is used to seed the local catalog; no transactions are processed against any real UrbanStems system.
