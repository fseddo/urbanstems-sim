from typing import Any, cast
from django.db.models import Min, Max
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from .filters import ProductFilter, ReviewFilter
from .models import (
    Product, Category, Collection, Occasion, Review,
    StemType, Color,
)
from .serializers import (
    ProductListSerializer, ProductDetailSerializer,
    CategorySerializer, CollectionSerializer, OccasionSerializer,
    ReviewSerializer
)


# Position-ordering taxonomies: when ?category|collection|occasion is set and
# no explicit ?ordering= is supplied, sort by the through-model's `position`
# so curated ordering takes effect. First match wins.
_POSITION_ORDERINGS = (
    ('category', 'productcategory__position'),
    ('collection', 'productcollection__position'),
    ('occasion', 'productoccasion__position'),
)


def _attach_variants_cache(products: list[Product]) -> None:
    """Bulk-fetch sibling products for a list of products and attach them as
    `_variants_cache` on each instance, so per-product serialization reads
    from the cache instead of firing one query per row. One additional query
    for the entire page, regardless of page size.
    """
    if not products:
        return
    base_names = {p.base_name for p in products}
    siblings = Product.objects.filter(base_name__in=base_names).order_by('base_name', 'id')
    by_base_name: dict[str, list[Product]] = {}
    for sibling in siblings:
        by_base_name.setdefault(sibling.base_name, []).append(sibling)
    for product in products:
        product._variants_cache = by_base_name.get(product.base_name, [])


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Product model
    Provides list and detail views
    """
    queryset = Product.objects.all()
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'base_name', 'description']
    ordering_fields = ['name', 'price', 'reviews_rating', 'created_at', 'external_id']

    def get_serializer_class(self) -> Any:
        if self.action == 'list':
            return ProductListSerializer
        return ProductDetailSerializer

    def get_queryset(self) -> Any:
        request = cast(Request, self.request)
        queryset = Product.objects.all().distinct()

        # Detail view serializes nested categories/collections/occasions —
        # prefetch them so a single detail render is one query per relation
        # instead of one per relation per access. List view's serializer
        # doesn't include taxonomies, so we don't pay for prefetch there.
        if self.action == 'retrieve':
            queryset = queryset.prefetch_related('categories', 'collections', 'occasions')

        if request.query_params.get('ordering'):
            return queryset

        for param, ordering in _POSITION_ORDERINGS:
            if request.query_params.get(param):
                return queryset.order_by(ordering)
        return queryset.order_by('external_id')

    def list(self, request, *args, **kwargs):
        """Override to bulk-fetch sibling products for the visible page so the
        per-product `variants` serializer doesn't fire one query per row.
        """
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        items = page if page is not None else list(queryset)
        _attach_variants_cache(items)
        serializer = self.get_serializer(items, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

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
    filter_backends = [DjangoFilterBackend]
    filterset_class = ReviewFilter
