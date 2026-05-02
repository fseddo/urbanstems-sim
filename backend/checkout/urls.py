from django.urls import path

from .views import create_payment_intent
from .webhooks import stripe_webhook

urlpatterns = [
    path('create-payment-intent/', create_payment_intent),
    path('webhook/', stripe_webhook),
]
