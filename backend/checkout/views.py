import json

import stripe
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from products.models import Product


def _missing_key_response() -> Response:
    return Response(
        {'detail': 'STRIPE_SECRET_KEY is not configured on the server.'},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


def _compute_totals(line_items: list[dict]) -> tuple[int, list[dict]]:
    """
    Resolve cart lines against the products DB and return (subtotal_cents, resolved_lines).

    Prices come from the DB, never the client — the request body only carries
    slug + quantity. Discounted price wins when set.
    """
    slugs = [item.get('slug') for item in line_items if item.get('slug')]
    products = {p.slug: p for p in Product.objects.filter(slug__in=slugs)}

    resolved: list[dict] = []
    subtotal_cents = 0
    for raw in line_items:
        slug = raw.get('slug')
        quantity = int(raw.get('quantity') or 0)
        if not slug or quantity <= 0:
            continue
        product = products.get(slug)
        if not product:
            continue
        unit_cents = product.discounted_price or product.price
        if unit_cents is None:
            continue
        line_cents = unit_cents * quantity
        subtotal_cents += line_cents
        resolved.append({
            'slug': slug,
            'name': product.name,
            'quantity': quantity,
            'unit_cents': unit_cents,
            'line_cents': line_cents,
        })

    return subtotal_cents, resolved


def _shipping_cents(subtotal_cents: int) -> int:
    if subtotal_cents <= 0:
        return 0
    if subtotal_cents >= settings.CHECKOUT_FREE_SHIPPING_THRESHOLD_CENTS:
        return 0
    return settings.CHECKOUT_FLAT_SHIPPING_CENTS


def _tax_cents(subtotal_cents: int) -> int:
    return round(subtotal_cents * settings.CHECKOUT_TAX_RATE_PCT / 100)


@api_view(['POST'])
def create_payment_intent(request):
    if not settings.STRIPE_SECRET_KEY:
        return _missing_key_response()

    line_items = request.data.get('line_items') or []
    if not isinstance(line_items, list) or not line_items:
        return Response(
            {'detail': 'line_items is required and must be non-empty.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    subtotal_cents, resolved = _compute_totals(line_items)
    if not resolved:
        return Response(
            {'detail': 'No valid items in cart.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    shipping_cents = _shipping_cents(subtotal_cents)
    tax_cents = _tax_cents(subtotal_cents)
    total_cents = subtotal_cents + shipping_cents + tax_cents

    # Trim line metadata to fit Stripe's 500-char-per-value limit. We include
    # slug/name/qty/cents per line — the webhook uses slug to look up product
    # images at email-render time.
    lines_metadata = json.dumps(
        [
            {
                'slug': line['slug'],
                'name': line['name'],
                'qty': line['quantity'],
                'cents': line['line_cents'],
            }
            for line in resolved
        ],
        separators=(',', ':'),
    )

    stripe.api_key = settings.STRIPE_SECRET_KEY
    try:
        intent = stripe.PaymentIntent.create(
            amount=total_cents,
            currency=settings.STRIPE_CURRENCY,
            automatic_payment_methods={'enabled': True},
            metadata={
                'subtotal_cents': str(subtotal_cents),
                'shipping_cents': str(shipping_cents),
                'tax_cents': str(tax_cents),
                'item_count': str(sum(line['quantity'] for line in resolved)),
                'lines': lines_metadata[:500],
            },
        )
    except stripe.error.StripeError as e:
        return Response(
            {'detail': f'Stripe error: {e.user_message or str(e)}'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response({
        'client_secret': intent.client_secret,
        'amount_cents': total_cents,
        'subtotal_cents': subtotal_cents,
        'shipping_cents': shipping_cents,
        'tax_cents': tax_cents,
        'currency': settings.STRIPE_CURRENCY,
        'lines': resolved,
    })
