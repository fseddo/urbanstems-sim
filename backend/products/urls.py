from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    ProductViewSet, ReviewViewSet,
    FacetViewSet, TagViewSet,
)

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'reviews', ReviewViewSet)
router.register(r'facets', FacetViewSet)
router.register(r'tags', TagViewSet, basename='tag')

urlpatterns = [
    path('api/', include(router.urls)),
]
