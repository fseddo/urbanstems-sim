from django.urls import path

from .views import autocomplete, details, detect_location

urlpatterns = [
    path('autocomplete/', autocomplete),
    path('details/', details),
    path('detect/', detect_location),
]
