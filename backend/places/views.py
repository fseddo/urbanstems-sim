import ipaddress
from pathlib import Path

import geoip2.database
import geoip2.errors
import requests
from django.conf import settings
from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle


def _real_client_ip(request) -> str | None:
    """Pick the original client IP from X-Forwarded-For when behind exactly
    `settings.TRUSTED_PROXY_HOPS` trusted proxies. Returns None when XFF
    cannot be trusted (no proxy configured, header missing, or fewer entries
    than hops) — callers chain their own fallback (REMOTE_ADDR for plain
    reads, DRF's `super().get_ident()` for throttle keys).
    """
    hops = getattr(settings, 'TRUSTED_PROXY_HOPS', 0)
    if hops <= 0:
        return None
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if not xff:
        return None
    ips = [ip.strip() for ip in xff.split(',') if ip.strip()]
    if len(ips) < hops:
        return None
    return ips[-hops]


class _RealClientIPThrottle(AnonRateThrottle):
    """
    Honors X-Forwarded-For when behind a known number of trusted proxies
    (settings.TRUSTED_PROXY_HOPS). Picks ips[-N] — the entry written by the
    outermost trusted proxy, which is the original client IP assuming that
    proxy strips client-supplied XFF entries.
    """
    def get_ident(self, request):
        return _real_client_ip(request) or super().get_ident(request)


class _AutocompleteThrottle(_RealClientIPThrottle):
    scope = 'places-autocomplete'


class _DetailsThrottle(_RealClientIPThrottle):
    scope = 'places-details'


class _DetectThrottle(_RealClientIPThrottle):
    scope = 'places-detect'

PLACES_AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete'
PLACES_DETAILS_URL = 'https://places.googleapis.com/v1/places/{place_id}'
PLACES_DETAILS_FIELD_MASK = 'id,formattedAddress,location,displayName'

# Bias autocomplete to results within this radius (meters) of the supplied
# lat/lng. 50km covers a metro area without being so wide that the bias
# stops mattering.
LOCATION_BIAS_RADIUS_M = 50000

UPSTREAM_TIMEOUT_S = 5

AUTOCOMPLETE_CACHE_TTL_S = 60 * 60
DETAILS_CACHE_TTL_S = 24 * 60 * 60


def _missing_key_response() -> Response:
    return Response(
        {'detail': 'GOOGLE_MAPS_API_KEY is not configured on the server.'},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


@api_view(['GET'])
@throttle_classes([_AutocompleteThrottle])
def autocomplete(request):
    api_key = settings.GOOGLE_MAPS_API_KEY
    if not api_key:
        return _missing_key_response()

    query = request.query_params.get('q', '').strip().lower()
    if len(query) < 3:
        return Response({'predictions': []})

    lat_raw = request.query_params.get('lat')
    lng_raw = request.query_params.get('lng')
    bias_lat: float | None = None
    bias_lng: float | None = None
    if lat_raw and lng_raw:
        try:
            bias_lat = float(lat_raw)
            bias_lng = float(lng_raw)
        except ValueError:
            pass

    # Cache key intentionally excludes the session token: the same input
    # should hit cache regardless of which session asked for it. lat/lng are
    # rounded to ~1km so users in the same neighborhood share entries without
    # losing meaningful bias precision.
    cache_lat = round(bias_lat, 2) if bias_lat is not None else None
    cache_lng = round(bias_lng, 2) if bias_lng is not None else None
    cache_key = f'places:autocomplete:{query}:{cache_lat}:{cache_lng}'

    cached = cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    body: dict = {'input': query}

    session = request.query_params.get('session')
    if session:
        body['sessionToken'] = session

    if bias_lat is not None and bias_lng is not None:
        body['locationBias'] = {
            'circle': {
                'center': {'latitude': bias_lat, 'longitude': bias_lng},
                'radius': LOCATION_BIAS_RADIUS_M,
            }
        }

    try:
        resp = requests.post(
            PLACES_AUTOCOMPLETE_URL,
            json=body,
            headers={
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': api_key,
            },
            timeout=UPSTREAM_TIMEOUT_S,
        )
    except requests.RequestException as e:
        return Response(
            {'detail': f'Upstream request failed: {e}'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if not resp.ok:
        return Response(
            {'detail': 'Google Places autocomplete failed.', 'upstream': resp.text},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    data = resp.json()
    predictions = []
    for suggestion in data.get('suggestions', []):
        place = suggestion.get('placePrediction')
        if not place:
            continue
        structured = place.get('structuredFormat', {}) or {}
        predictions.append({
            'place_id': place.get('placeId'),
            'description': (place.get('text') or {}).get('text', ''),
            'main_text': (structured.get('mainText') or {}).get('text', ''),
            'secondary_text': (structured.get('secondaryText') or {}).get('text', ''),
        })

    payload = {'predictions': predictions}
    cache.set(cache_key, payload, AUTOCOMPLETE_CACHE_TTL_S)
    return Response(payload)


@api_view(['GET'])
@throttle_classes([_DetailsThrottle])
def details(request):
    api_key = settings.GOOGLE_MAPS_API_KEY
    if not api_key:
        return _missing_key_response()

    place_id = request.query_params.get('place_id', '').strip()
    if not place_id:
        return Response(
            {'detail': 'place_id is required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    cache_key = f'places:details:{place_id}'
    cached = cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    params = {}
    session = request.query_params.get('session')
    if session:
        params['sessionToken'] = session

    try:
        resp = requests.get(
            PLACES_DETAILS_URL.format(place_id=place_id),
            params=params,
            headers={
                'X-Goog-Api-Key': api_key,
                'X-Goog-FieldMask': PLACES_DETAILS_FIELD_MASK,
            },
            timeout=UPSTREAM_TIMEOUT_S,
        )
    except requests.RequestException as e:
        return Response(
            {'detail': f'Upstream request failed: {e}'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if not resp.ok:
        return Response(
            {'detail': 'Google Places details failed.', 'upstream': resp.text},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    data = resp.json()
    location = data.get('location') or {}
    payload = {
        'place_id': data.get('id', place_id),
        'description': data.get('formattedAddress', ''),
        'name': (data.get('displayName') or {}).get('text', ''),
        'lat': location.get('latitude'),
        'lng': location.get('longitude'),
    }
    cache.set(cache_key, payload, DETAILS_CACHE_TTL_S)
    return Response(payload)


_geoip_reader: geoip2.database.Reader | None = None
_geoip_reader_path: str | None = None


def _get_geoip_reader() -> geoip2.database.Reader | None:
    global _geoip_reader, _geoip_reader_path
    path = settings.GEOIP_DB_PATH
    if _geoip_reader is not None and _geoip_reader_path == path:
        return _geoip_reader
    if not path or not Path(path).exists():
        return None
    _geoip_reader = geoip2.database.Reader(path)
    _geoip_reader_path = path
    return _geoip_reader


def _client_ip(request) -> str | None:
    # See _real_client_ip / _RealClientIPThrottle for the trust-boundary logic.
    return _real_client_ip(request) or request.META.get('REMOTE_ADDR')


def _fallback_payload(source: str) -> dict:
    return {
        'lat': settings.GEOIP_FALLBACK_LAT,
        'lng': settings.GEOIP_FALLBACK_LNG,
        'city': None,
        'region': None,
        'country': None,
        'source': source,
    }


@api_view(['GET'])
@throttle_classes([_DetectThrottle])
def detect_location(request):
    ip = _client_ip(request)
    if not ip:
        return Response(_fallback_payload('no-ip'))

    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return Response(_fallback_payload('bad-ip'))

    if addr.is_private or addr.is_loopback or addr.is_link_local:
        return Response(_fallback_payload('private-ip'))

    reader = _get_geoip_reader()
    if reader is None:
        return Response(_fallback_payload('no-db'))

    try:
        city = reader.city(ip)
    except geoip2.errors.AddressNotFoundError:
        return Response(_fallback_payload('not-found'))

    lat = city.location.latitude
    lng = city.location.longitude
    if lat is None or lng is None:
        return Response(_fallback_payload('no-coords'))

    return Response({
        'lat': lat,
        'lng': lng,
        'city': city.city.name,
        'region': city.subdivisions.most_specific.name,
        'country': city.country.iso_code,
        'source': 'geoip',
    })
