# Claude rules for the Django backend

## Reseeding the catalog (`SEED_ON_BOOT`)

`seed_products --clear` is **destructive** — it wipes Products, Reviews, all M2M tables, and all taxonomies, then rebuilds from `data/products.json` ([seed_products.py:138-152](products/management/commands/seed_products.py#L138-L152)). The Dockerfile `CMD` gates this on `SEED_ON_BOOT=true` so prod doesn't reseed on every restart.

**Default is `false` everywhere.** Migrations always run; seed + blur generation only run when `SEED_ON_BOOT=true`.

**When to flip the flag on Railway:**
- Updated `data/products.json` and want the change live.
- Schema migration touched product data and the seed needs to repopulate.
- First-ever deploy of an empty database.

**How:** set `SEED_ON_BOOT=true` in Railway env, redeploy, **then unset it** (or set to `false`). Leaving it on means every subsequent restart wipes admin edits and churns primary keys (which breaks any external system that holds product IDs — Stripe metadata, search indexes, etc.).

**Local dev** runs `python manage.py runserver` directly via `docker-compose.yml`'s `command:` override, which bypasses the Dockerfile `CMD` entirely — so seeding never runs from Compose. Reseed locally with `docker compose exec web python manage.py seed_products --clear`.
