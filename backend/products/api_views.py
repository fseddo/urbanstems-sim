from typing import Any, cast
from django.db.models import Min, Max, OuterRef, Subquery
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from .filters import ProductFilter, ReviewFilter, TagFilter, LANDING_FACET_SLUGS
from .models import Product, Review, Facet, Tag, ProductTag
from .serializers import (
    ProductListSerializer, ProductDetailSerializer,
    ReviewSerializer, FacetSerializer, TagSerializer,
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


def _single_landing_tag(request: Request) -> tuple[str, str] | None:
    """If the request supplies exactly one landing-facet param with exactly
    one value, return (facet_slug, tag_slug). Used by the viewset to apply
    curated `position` ordering. Returns None for multi-select or zero
    landing-tag scopes. Param name === facet slug."""
    matched: tuple[str, str] | None = None
    for facet_slug in LANDING_FACET_SLUGS:
        raw = request.query_params.getlist(facet_slug)
        slugs: list[str] = []
        for v in raw:
            slugs.extend(s.strip() for s in v.split(','))
        slugs = [s for s in slugs if s]
        if not slugs:
            continue
        if len(slugs) > 1 or matched is not None:
            return None  # multi-select or multiple landing facets → no curated order
        matched = (facet_slug, slugs[0])
    return matched


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """List + detail for products. Filtering via ProductFilter (per-facet
    tag params + price + vase_included + badge_text + variant_type)."""
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

        # Detail view serializes nested tags — prefetch with select_related
        # on facet so each tag carries its facet without extra queries.
        if self.action == 'retrieve':
            queryset = queryset.prefetch_related('tags__facet')

        if request.query_params.get('ordering'):
            return queryset

        # Curated ordering when filtered to exactly one landing tag — annotate
        # with the matching ProductTag.position so the order is unambiguous
        # even when other facet filters add joins on the same ProductTag table.
        if (single := _single_landing_tag(request)) is not None:
            facet_slug, tag_slug = single
            position_subquery = ProductTag.objects.filter(
                product=OuterRef('pk'),
                tag__facet__slug=facet_slug,
                tag__slug=tag_slug,
            ).values('position')[:1]
            return queryset.annotate(
                _curated_position=Subquery(position_subquery)
            ).order_by('_curated_position', 'name')

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
        within the current scope. Scope is defined by URL-path-level params
        (the landing tag the user is on, plus search). UI-applied multi-select
        filters (the sidebar checkboxes) are intentionally NOT applied — the
        sidebar should keep showing all base-scope options so the user can
        multi-select without options vanishing from under them.

        Response shape groups available tag slugs by facet slug, plus
        price_range + vase_included presence.
        """
        queryset = Product.objects.all()

        # Scope filters: the URL-context landing tag + free-text search
        for facet_slug in LANDING_FACET_SLUGS:
            scope_slugs = request.query_params.getlist(facet_slug)
            scope_slugs = [s for raw in scope_slugs for s in raw.split(',') if s.strip()]
            if scope_slugs:
                tag_ids = list(
                    Tag.objects.filter(facet__slug=facet_slug, slug__in=scope_slugs)
                    .values_list('id', flat=True)
                )
                queryset = queryset.filter(producttag__tag_id__in=tag_ids)
        if search := request.query_params.get('search'):
            queryset = queryset.filter(name__icontains=search)
        queryset = queryset.distinct()

        # Per-facet available tag slugs in the scope
        facets: dict[str, list[str]] = {}
        for facet in Facet.objects.all():
            facets[facet.slug] = list(
                Tag.objects.filter(
                    facet=facet,
                    producttag__product__in=queryset,
                ).distinct().values_list('slug', flat=True)
            )

        vase_included = queryset.filter(vase_included=True).exists()
        price = queryset.aggregate(min=Min('price'), max=Max('price'))

        return Response({
            'facets': facets,
            'vase_included': vase_included,
            'price_range': {
                # Stored cents → dollars for the UI; null when scope is empty
                'min': (price['min'] // 100) if price['min'] is not None else None,
                'max': (price['max'] // 100) if price['max'] is not None else None,
            },
        })


class FacetViewSet(viewsets.ReadOnlyModelViewSet):
    """List + detail for Facet definitions (5 rows). No pagination."""
    queryset = Facet.objects.all()
    serializer_class = FacetSerializer
    lookup_field = 'slug'
    pagination_class = None


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """List + detail for Tag rows. List filterable by `?facet=<slug>`. Detail
    by slug only resolves landing-kind tags (slug uniqueness only enforced
    among them — filter-kind tags can collide e.g. 'peonies' is both
    category and stem_type)."""
    serializer_class = TagSerializer
    lookup_field = 'slug'
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_class = TagFilter

    def get_queryset(self) -> Any:
        if self.action == 'retrieve':
            return Tag.objects.select_related('facet').filter(facet__kind='landing')
        return Tag.objects.select_related('facet')


class ReviewViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Review model. Filter by product slug:
    /api/reviews/?product_slug=the-sorbet"""
    queryset = Review.objects.select_related('product').all()
    serializer_class = ReviewSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = ReviewFilter
