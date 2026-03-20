from typing import Any, cast
from rest_framework import viewsets, filters
from rest_framework.request import Request
from .models import Product, Category, Collection, Occasion, Review
from .serializers import (
    ProductListSerializer, ProductDetailSerializer,
    CategorySerializer, CollectionSerializer, OccasionSerializer,
    ReviewSerializer
)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Product model
    Provides list and detail views
    """
    queryset = Product.objects.all()
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'base_name', 'description']
    ordering_fields = ['name', 'price', 'reviews_rating', 'created_at', 'external_id']

    def get_serializer_class(self) -> Any:
        if self.action == 'list':
            return ProductListSerializer
        return ProductDetailSerializer

    def get_queryset(self) -> Any:
        queryset = Product.objects.all()
        request = cast(Request, self.request)
        position_ordering = None

        # Filter by category
        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(
                productcategory__category__slug=category
            )
            position_ordering = 'productcategory__position'

        # Filter by collection
        collection = request.query_params.get('collection')
        if collection:
            queryset = queryset.filter(
                productcollection__collection__slug=collection
            )
            position_ordering = 'productcollection__position'

        # Filter by occasion
        occasion = request.query_params.get('occasion')
        if occasion:
            queryset = queryset.filter(
                productoccasion__occasion__slug=occasion
            )
            position_ordering = 'productoccasion__position'
        
        # Filter by badge text
        badge_text = request.query_params.get('badge_text')
        if badge_text:
            queryset = queryset.filter(badge_text=badge_text)

        # Filter by variant type
        variant_type = request.query_params.get('variant_type')
        if variant_type:
            queryset = queryset.filter(variant_type=variant_type)
        
        # Filter by price range
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=int(min_price) * 100)  # Convert to cents
        if max_price:
            queryset = queryset.filter(price__lte=int(max_price) * 100)  # Convert to cents
        
        # Use position ordering when filtering by collection/category/occasion,
        # fall back to external_id otherwise. Only apply if no explicit sort requested,
        # so DRF's OrderingFilter can still take over when ?ordering= is provided.
        if not request.query_params.get('ordering'):
            if position_ordering:
                queryset = queryset.order_by(position_ordering)
            else:
                queryset = queryset.order_by('external_id')

        return queryset.distinct()


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Category model
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    pagination_class = None


class CollectionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Collection model
    """
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializer
    lookup_field = 'slug'
    pagination_class = None


class OccasionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Occasion model
    """
    queryset = Occasion.objects.all()
    serializer_class = OccasionSerializer
    lookup_field = 'slug'
    pagination_class = None


class ReviewViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Review model.
    Filter by product slug: /api/reviews/?product_slug=the-sorbet
    """
    queryset = Review.objects.select_related('product').all()
    serializer_class = ReviewSerializer

    def get_queryset(self) -> Any:
        queryset = Review.objects.select_related('product').all()
        request = cast(Request, self.request)

        product_slug = request.query_params.get('product_slug')
        if product_slug:
            queryset = queryset.filter(product__slug=product_slug)

        return queryset