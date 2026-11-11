"""Proxy-aware client-IP resolution + the throttle base class built on it.

Shared by every app that rate-limits per client IP (places, checkout) so the
trust-boundary policy lives in exactly one place.
"""
from django.conf import settings
from rest_framework.throttling import AnonRateThrottle


def real_client_ip(request) -> str | None:
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


class RealClientIPThrottle(AnonRateThrottle):
    """
    Honors X-Forwarded-For when behind a known number of trusted proxies
    (settings.TRUSTED_PROXY_HOPS). Picks ips[-N] — the entry written by the
    outermost trusted proxy, which is the original client IP assuming that
    proxy strips client-supplied XFF entries.
    """
    def get_ident(self, request):
        return real_client_ip(request) or super().get_ident(request)
