"""Stripe webhook handler.

Stripe POSTs events here after a payment is processed. We trust nothing the
client says — instead we verify the signature against STRIPE_WEBHOOK_SECRET
and read everything we need from the event payload.

The handler must:
  * read the raw request body (signature verification hashes the exact bytes)
  * return 2xx quickly — Stripe retries non-2xx for up to 3 days
  * be idempotent — Stripe can deliver the same event more than once
"""
import logging

import stripe
from django.conf import settings
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .emails import send_order_confirmation

logger = logging.getLogger(__name__)


@csrf_exempt
@require_POST
def stripe_webhook(request):
    if not settings.STRIPE_WEBHOOK_SECRET:
        logger.error('STRIPE_WEBHOOK_SECRET not configured; rejecting webhook.')
        return HttpResponseBadRequest('Webhook secret not configured.')

    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        logger.warning('Webhook payload was not valid JSON.')
        return HttpResponseBadRequest('Invalid payload.')
    except stripe.error.SignatureVerificationError:
        logger.warning('Webhook signature verification failed.')
        return HttpResponseBadRequest('Invalid signature.')

    event_type = event['type']
    intent = event['data']['object']

    if event_type == 'payment_intent.succeeded':
        send_order_confirmation(intent)
    elif event_type == 'payment_intent.payment_failed':
        # No email on failure for now — just log so we can confirm the wiring.
        last_error = (intent.get('last_payment_error') or {}).get('message')
        logger.info(
            'PaymentIntent %s failed: %s', intent.get('id'), last_error or 'unknown'
        )
    else:
        # Other event types (we didn't subscribe to any, but Stripe occasionally
        # delivers events on the endpoint that we should ack-and-ignore).
        logger.debug('Ignoring unhandled webhook event type: %s', event_type)

    return HttpResponse(status=200)
