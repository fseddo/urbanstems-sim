"""Order confirmation email — built from the Stripe PaymentIntent's metadata
and shipping fields, then sent via Resend.

The webhook handler is the only caller. Idempotency is enforced via Django's
cache so duplicate webhook deliveries don't double-send.
"""
import json
import logging
import re

import resend
import stripe
from django.conf import settings
from django.core.cache import cache

from products.models import Product

logger = logging.getLogger(__name__)

EMAIL_SENT_TTL_S = 24 * 60 * 60


def _format_cents(cents: int | None) -> str:
    if cents is None:
        return '$0.00'
    return f'${cents / 100:.2f}'


def _format_address(name: str | None, address: dict | None) -> str:
    """Render an address as HTML lines: name, line1, line2, city/state/zip.
    Country is omitted — same convention real US ecommerce emails use."""
    if not address:
        return ''
    line1 = address.get('line1')
    line2 = address.get('line2')
    city = address.get('city')
    state = address.get('state')
    zip_code = address.get('postal_code')
    city_line = ', '.join(p for p in [city, state] if p)
    if zip_code:
        city_line = f'{city_line} {zip_code}'.strip()
    parts = [name, line1, line2, city_line]
    return '<br>'.join(p for p in parts if p)


def _order_number(intent_id: str) -> str:
    """Generate a short readable order number from the PaymentIntent ID.
    `pi_3TSRC8BfK4yGz7t31sJ0EQpL` → `US1SJ0EQPL`."""
    if not intent_id:
        return 'US00000000'
    suffix = re.sub(r'[^A-Za-z0-9]', '', intent_id)[-8:].upper()
    return f'US{suffix}'


def _image_url_for(slug: str, image_map: dict[str, str]) -> str:
    """Resolve the slug to a sized CDN URL for email display (~2x retina)."""
    raw = image_map.get(slug, '')
    if not raw:
        return ''
    sep = '&' if '?' in raw else '?'
    return f'{raw}{sep}width=240'


def _expanded_charge(intent: dict) -> dict:
    """Best-effort retrieval of the latest charge for billing + card details.
    Webhook payloads include latest_charge only as an ID; we re-fetch to get
    billing_details and payment_method_details in one call. Returns {} on
    failure — the email still renders with shipping-only info."""
    intent_id = intent.get('id')
    if not intent_id or not settings.STRIPE_SECRET_KEY:
        return {}
    try:
        stripe.api_key = settings.STRIPE_SECRET_KEY
        expanded = stripe.PaymentIntent.retrieve(
            intent_id, expand=['latest_charge']
        ).to_dict()
        return expanded.get('latest_charge') or {}
    except Exception:
        logger.exception(
            'Failed to retrieve expanded charge for intent %s', intent_id
        )
        return {}


def _format_card(card: dict | None) -> str:
    if not card:
        return ''
    brand = (card.get('brand') or '').replace('_', ' ').title() or 'Card'
    last4 = card.get('last4') or ''
    return f'{brand} ending in {last4}' if last4 else brand


_BODY_FONT = "Helvetica Neue,Helvetica,Arial,sans-serif"
_HEAD_FONT = "Georgia,'Times New Roman',serif"
_NAVY = '#0f2a4a'
_DIVIDER = '#e4ddd4'
_MUTED = '#8a7d6b'
_BODY_TEXT = '#5a5046'
_DARK_TEXT = '#3d3628'



def _item_block(line: dict, image_map: dict[str, str]) -> str:
    slug = line.get('slug', '')
    img_url = _image_url_for(slug, image_map)
    name = line.get('name', '')
    img_html = (
        f'<img src="{img_url}" alt="{name}" width="120" height="120" '
        f'style="width:120px;height:120px;border-radius:3px;display:block;'
        f'object-fit:cover;">'
        if img_url
        else ''
    )
    return f'''
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
              <tr>
                <td width="120" style="vertical-align:top;padding-right:20px;">
                  {img_html}
                </td>
                <td style="vertical-align:middle;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="vertical-align:middle;">
                        <p style="margin:0 0 5px;font-family:{_HEAD_FONT};font-size:18px;font-weight:400;color:{_NAVY};line-height:1.3;">
                          {name}
                        </p>
                        <p style="margin:0;font-family:{_BODY_FONT};font-size:13px;color:{_MUTED};">
                          Qty: {line.get("qty", 1)}
                        </p>
                      </td>
                      <td align="right" style="vertical-align:middle;white-space:nowrap;">
                        <p style="margin:0;font-family:{_BODY_FONT};font-size:15px;font-weight:500;color:{_DARK_TEXT};">
                          {_format_cents(line.get("cents"))}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>'''


def _address_block(label: str, body_html: str) -> str:
    return f'''
                <p style="margin:0 0 8px;font-family:{_BODY_FONT};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:{_MUTED};font-weight:600;">
                  {label}
                </p>
                <p style="margin:0;font-family:{_BODY_FONT};font-size:14px;color:{_DARK_TEXT};line-height:1.7;">
                  {body_html}
                </p>'''


def _build_html(intent: dict) -> str:
    metadata = intent.get('metadata') or {}
    try:
        lines = json.loads(metadata.get('lines') or '[]')
    except json.JSONDecodeError:
        lines = []

    slugs = [line.get('slug') for line in lines if line.get('slug')]
    image_map = dict(
        Product.objects.filter(slug__in=slugs).values_list('slug', 'main_image')
    )

    subtotal = int(metadata.get('subtotal_cents') or 0)
    shipping_cents = int(metadata.get('shipping_cents') or 0)
    tax_cents = int(metadata.get('tax_cents') or 0)
    total_cents = intent.get('amount') or 0
    order_number = _order_number(intent.get('id') or '')
    logo_url = settings.EMAIL_LOGO_URL

    shipping = intent.get('shipping') or {}
    full_name = (shipping.get('name') or '').strip()
    first_name = full_name.split(' ', 1)[0] if full_name else 'there'
    shipping_html = _format_address(full_name, shipping.get('address'))

    charge = _expanded_charge(intent)
    billing_details = charge.get('billing_details') or {}
    billing_html = _format_address(
        billing_details.get('name'), billing_details.get('address')
    )
    card = (charge.get('payment_method_details') or {}).get('card') or {}
    payment_method_html = _format_card(card) or '—'

    shipping_method = 'Free Shipping' if shipping_cents == 0 else 'Standard Shipping'
    shipping_display = (
        'Free' if shipping_cents == 0 else _format_cents(shipping_cents)
    )
    # Billing block falls back to "Same as shipping" so the column always has
    # content — keeps the two-column grid balanced.
    billing_display = billing_html or 'Same as shipping address'

    item_divider = (
        f'\n            <table role="presentation" width="100%" cellpadding="0" '
        f'cellspacing="0" border="0" style="margin-bottom:32px;">'
        f'<tr><td style="border-top:1px solid {_DIVIDER};font-size:0;'
        f'line-height:0;">&nbsp;</td></tr></table>'
    )
    items_html = item_divider.join(
        _item_block(line, image_map) for line in lines
    )

    if logo_url:
        logo_block = (
            f'<img src="{logo_url}" alt="UrbanStems" width="56" height="56" '
            f'style="display:block;width:56px;height:56px;border-radius:50%;">'
        )
    else:
        logo_block = (
            "<div style=\"font-family:'Crimson Text',Georgia,serif;"
            "font-size:24px;letter-spacing:0.05em;color:#ffffff;\">URBANSTEMS</div>"
        )

    summary_row = (
        f'border-top:1px solid {_DIVIDER};padding:13px 0;'
        f'font-family:{_BODY_FONT};font-size:14px;color:{_BODY_TEXT};'
    )
    total_row = (
        f'border-top:2px solid {_NAVY};padding:18px 0 0;'
        f'font-family:{_BODY_FONT};color:{_NAVY};'
    )

    return f'''<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Your order is confirmed</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
    table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; }}
    img {{ -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; display: block; }}
    body {{ margin: 0 !important; padding: 0 !important; background-color: #f0ede8; }}
    a {{ color: inherit; }}
    @media screen and (max-width: 600px) {{
      .email-wrapper {{ width: 100% !important; }}
      .content-pad {{ padding-left: 24px !important; padding-right: 24px !important; }}
      .addr-cell {{ display: block !important; width: 100% !important; padding: 0 0 24px !important; }}
    }}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0ede8;">

<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f0ede8;">
  Your order #{order_number} has been confirmed. Thank you, {first_name}!
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0ede8;">
  <tr>
    <td align="center" style="padding:40px 16px 60px;">

      <table role="presentation" class="email-wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#fdfaf6;border-radius:4px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.08);">

        <tr>
          <td align="center" style="background-color:{_NAVY};padding:28px 48px;">
            {logo_block}
          </td>
        </tr>

        <tr>
          <td class="content-pad" align="center" style="padding:48px 48px 36px;border-bottom:1px solid {_DIVIDER};">
            <h1 style="margin:0 0 12px;font-family:{_HEAD_FONT};font-size:34px;font-weight:400;color:{_NAVY};line-height:1.2;letter-spacing:0.01em;">
              Your order is confirmed.
            </h1>
            <p style="margin:0 0 20px;font-family:{_BODY_FONT};font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:{_MUTED};font-weight:600;">
              Order #{order_number}
            </p>
            <p style="margin:0;font-family:{_BODY_FONT};font-size:15px;color:{_BODY_TEXT};line-height:1.75;max-width:380px;">
              Thank you, {first_name}. Your order has been received and is on its way. A copy of this confirmation has been sent to your email.
            </p>
          </td>
        </tr>

        <tr>
          <td class="content-pad" style="padding:40px 48px;border-bottom:1px solid {_DIVIDER};">
            <p style="margin:0 0 24px;font-family:{_BODY_FONT};font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:{_BODY_TEXT};font-weight:600;">
              Items in this order
            </p>
            {items_html}
          </td>
        </tr>

        <tr>
          <td class="content-pad" style="padding:36px 48px;border-bottom:1px solid {_DIVIDER};">
            <p style="margin:0 0 20px;font-family:{_BODY_FONT};font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:{_MUTED};font-weight:600;">
              Order summary
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="{summary_row}">Subtotal</td>
                <td align="right" style="{summary_row}">{_format_cents(subtotal)}</td>
              </tr>
              <tr>
                <td style="{summary_row}">Shipping</td>
                <td align="right" style="{summary_row}">{shipping_display}</td>
              </tr>
              <tr>
                <td style="{summary_row}">Tax</td>
                <td align="right" style="{summary_row}">{_format_cents(tax_cents)}</td>
              </tr>
              <tr>
                <td style="{total_row}font-size:15px;font-weight:600;letter-spacing:0.02em;">Total</td>
                <td align="right" style="{total_row}font-size:18px;font-weight:700;">{_format_cents(total_cents)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td class="content-pad" style="padding:36px 48px;border-bottom:1px solid {_DIVIDER};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="addr-cell" width="50%" style="vertical-align:top;padding-right:16px;padding-bottom:28px;">{_address_block('Shipping Address', shipping_html or '—')}</td>
                <td class="addr-cell" width="50%" style="vertical-align:top;padding-left:16px;padding-bottom:28px;">{_address_block('Billing Address', billing_display)}</td>
              </tr>
              <tr>
                <td class="addr-cell" width="50%" style="vertical-align:top;padding-right:16px;">{_address_block('Shipping Method', shipping_method)}</td>
                <td class="addr-cell" width="50%" style="vertical-align:top;padding-left:16px;">{_address_block('Payment Method', payment_method_html)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td align="center" style="background-color:{_NAVY};padding:28px 48px;">
            <p style="margin:0;font-family:{_BODY_FONT};font-size:12px;color:rgba(255,255,255,0.5);letter-spacing:0.04em;line-height:1.7;">
              This is a sim — no actual flowers will be delivered.
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>'''


def send_order_confirmation(intent: dict) -> bool:
    """
    Send an order confirmation email for a succeeded PaymentIntent.

    Returns True if an email was sent, False if skipped (no API key, no
    recipient, already sent, etc.).
    """
    if not settings.RESEND_API_KEY:
        logger.warning('RESEND_API_KEY not configured; skipping confirmation email.')
        return False

    to = intent.get('receipt_email')
    if not to:
        logger.info('No receipt_email on intent %s; skipping email.', intent.get('id'))
        return False

    cache_key = f'order_email_sent:{intent.get("id")}'
    if cache.get(cache_key):
        logger.info('Email already sent for intent %s; skipping.', intent.get('id'))
        return False

    resend.api_key = settings.RESEND_API_KEY
    try:
        resend.Emails.send({
            'from': settings.EMAIL_FROM,
            'to': to,
            'subject': 'Your UrbanStems order is confirmed',
            'html': _build_html(intent),
        })
    except Exception:
        logger.exception('Resend send failed for intent %s.', intent.get('id'))
        return False

    cache.set(cache_key, True, timeout=EMAIL_SENT_TTL_S)
    logger.info('Sent order confirmation for intent %s to %s.', intent.get('id'), to)
    return True
