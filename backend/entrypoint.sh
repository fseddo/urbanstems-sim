#!/usr/bin/env bash
# Container entrypoint. Lazily downloads the MaxMind GeoLite2-City database
# if it is missing or older than 30 days, then exec's the supplied command.
# The MAXMIND_LICENSE_KEY env var must be set for downloads to succeed; if
# it is unset, the script logs a warning and skips the download. The detect
# endpoint then returns its fallback coords (source: 'no-db'), so the app
# stays functional either way.
set -e

GEOIP_DIR="/app/data/geoip"
GEOIP_FILE="$GEOIP_DIR/GeoLite2-City.mmdb"
GEOIP_MAX_AGE_DAYS=30

mkdir -p "$GEOIP_DIR"

needs_download=true
if [ -f "$GEOIP_FILE" ] \
   && [ -n "$(find "$GEOIP_FILE" -mtime "-${GEOIP_MAX_AGE_DAYS}" 2>/dev/null)" ]; then
    needs_download=false
fi

if [ "$needs_download" = "true" ]; then
    if [ -n "$MAXMIND_LICENSE_KEY" ]; then
        echo "[entrypoint] Downloading MaxMind GeoLite2-City..."
        tmpfile=$(mktemp)
        if curl -fsSL -o "$tmpfile" \
            "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=${MAXMIND_LICENSE_KEY}&suffix=tar.gz"; then
            extract_dir=$(mktemp -d)
            tar -xzf "$tmpfile" -C "$extract_dir"
            mv "$extract_dir"/GeoLite2-City_*/GeoLite2-City.mmdb "$GEOIP_FILE"
            rm -rf "$extract_dir"
            echo "[entrypoint] MaxMind DB updated at $GEOIP_FILE"
        else
            echo "[entrypoint] WARNING: MaxMind download failed; detect endpoint will use fallback coords."
        fi
        rm -f "$tmpfile"
    else
        echo "[entrypoint] MAXMIND_LICENSE_KEY not set; skipping GeoIP download."
    fi
fi

exec "$@"
