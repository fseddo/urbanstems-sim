from typing import Any, cast
from django.db.models import Min, Max
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from .models import (
    Product, Category, Collection, Occasion, Review,
    StemType, Color,
)
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

        # Filter by category (single slug, used for category landing pages)
        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(
                productcategory__category__slug=category
            )
            position_ordering = 'productcategory__position'

        # Filter by categories (multi-select from filter sidebar)
        categories = request.query_params.getlist('categories')
        if categories:
            queryset = queryset.filter(
                productcategory__category__slug__in=categories
            )

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
        
        # Filter by stem types (multi-select from filter sidebar)
        stem_types = request.query_params.getlist('stem_types')
        if stem_types:
            queryset = queryset.filter(
                productstemtype__stem_type__slug__in=stem_types
            )

        # Filter by colors (multi-select from filter sidebar)
        colors = request.query_params.getlist('colors')
        if colors:
            queryset = queryset.filter(
                productcolor__color__slug__in=colors
            )

        # Filter by vase-included
        if request.query_params.get('vase_included') == 'true':
            queryset = queryset.filter(vase_included=True)

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

    @action(detail=False, methods=['get'], url_path='filter-options')
    def filter_options(self, request):
        """Return the set of filter values that have ≥1 matching product
        within the current scope (collection / category / occasion / search).

        UI-applied multi-select filters (categories[], stem_types[], colors[],
        vase_included, min_price, max_price) are intentionally NOT applied
        here — the sidebar should keep showing all base-scope options so the
        user can multi-select without options vanishing from under them.
        """
        queryset = Product.objects.all()

        if collection := request.query_params.get('collection'):
            queryset = queryset.filter(productcollection__collection__slug=collection)
        if category := request.query_params.get('category'):
            queryset = queryset.filter(productcategory__category__slug=category)
        if occasion := request.query_params.get('occasion'):
            queryset = queryset.filter(productoccasion__occasion__slug=occasion)
        if search := request.query_params.get('search'):
            queryset = queryset.filter(name__icontains=search)

        queryset = queryset.distinct()

        categories = list(
            Category.objects.filter(productcategory__product__in=queryset)
            .distinct().values_list('slug', flat=True)
        )
        stem_types = list(
            StemType.objects.filter(productstemtype__product__in=queryset)
            .distinct().values_list('slug', flat=True)
        )
        colors = list(
            Color.objects.filter(productcolor__product__in=queryset)
            .distinct().values_list('slug', flat=True)
        )
        vase_included = queryset.filter(vase_included=True).exists()
        price = queryset.aggregate(min=Min('price'), max=Max('price'))

        return Response({
            'categories': categories,
            'stem_types': stem_types,
            'colors': colors,
            'vase_included': vase_included,
            'price_range': {
                # Stored cents → dollars for the UI; null when scope is empty
                'min': (price['min'] // 100) if price['min'] is not None else None,
                'max': (price['max'] // 100) if price['max'] is not None else None,
            },
        })


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Category model
    """
    queryset = Category.objects.order_by('id')
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    pagination_class = None


class CollectionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Collection model
    """
    queryset = Collection.objects.order_by('id')
    serializer_class = CollectionSerializer
    lookup_field = 'slug'
    pagination_class = None


class OccasionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Occasion model
    """
    queryset = Occasion.objects.order_by('id')
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