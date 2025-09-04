from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import ProductViewSet, CategoryViewSet, CollectionViewSet, OccasionViewSet

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'collections', CollectionViewSet)
router.register(r'occasions', OccasionViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]