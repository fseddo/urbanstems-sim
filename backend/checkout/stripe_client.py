"""Configured Stripe SDK module.

`stripe.api_key` is a module-level global on the `stripe` package. Setting it
here at import time means views/emails/webhooks can `from .stripe_client
import stripe` instead of re-assigning the key inline before each call. This
file is the single source of that mutation.
"""
import stripe
from django.conf import settings

stripe.api_key = settings.STRIPE_SECRET_KEY
