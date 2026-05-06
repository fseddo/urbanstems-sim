import django_filters

from .models import Product, Review, Tag


# All 5 facet slugs. Query param name === facet slug — no indirection.
ALL_FACET_SLUGS = ('category', 'collection', 'occasion', 'color', 'stem_type')

# Landing-kind facets (those whose tags have their own pages and curated
# `position` ordering). The viewset uses this to apply position-ordering
# when exactly one landing-facet param with one value is supplied.
LANDING_FACET_SLUGS = ('category', 'collection', 'occasion')


class ProductFilter(django_filters.FilterSet):
    """Per-facet multi-select via repeated query params (`?color=red&color=pink`)
    or comma-separated (`?color=red,pink`). OR within a facet, AND across
    facets. Param names match facet slugs."""

    category = django_filters.CharFilter(method='_filter_category')
    collection = django_filters.CharFilter(method='_filter_collection')
    occasion = django_filters.CharFilter(method='_filter_occasion')
    color = django_filters.CharFilter(method='_filter_color')
    stem_type = django_filters.CharFilter(method='_filter_stem_type')

    # Non-tag (Product-column) filters
    vase_included = django_filters.CharFilter(method='_filter_vase_included')
    badge_text = django_filters.CharFilter(field_name='badge_text')
    variant_type = django_filters.CharFilter(field_name='variant_type')

    # Price input is in dollars; stored as cents.
    min_price = django_filters.NumberFilter(method='_filter_min_price')
    max_price = django_filters.NumberFilter(method='_filter_max_price')

    class Meta:
        model = Product
        fields: list[str] = []

    def _filter_tags_in_facet(self, queryset, facet_slug: str):
        """Filter products to those tagged with any tag whose slug ∈ the
        facet's param values. Param name === facet slug."""
        if not self.request:
            return queryset
        # Accept both repeated params and comma-separated values
        raw = self.request.GET.getlist(facet_slug)
        slugs: list[str] = []
        for v in raw:
            slugs.extend(s.strip() for s in v.split(','))
        slugs = [s for s in slugs if s]
        if not slugs:
            return queryset
        # Resolve tags first (composite slug+facet); then filter products by
        # the tag IDs. Avoids a join with two conditions on the same table.
        tag_ids = list(
            Tag.objects.filter(facet__slug=facet_slug, slug__in=slugs)
            .values_list('id', flat=True)
        )
        if not tag_ids:
            return queryset.none()
        return queryset.filter(producttag__tag_id__in=tag_ids)

    def _filter_category(self, queryset, name, value):
        return self._filter_tags_in_facet(queryset, 'category')

    def _filter_collection(self, queryset, name, value):
        return self._filter_tags_in_facet(queryset, 'collection')

    def _filter_occasion(self, queryset, name, value):
        return self._filter_tags_in_facet(queryset, 'occasion')

    def _filter_color(self, queryset, name, value):
        return self._filter_tags_in_facet(queryset, 'color')

    def _filter_stem_type(self, queryset, name, value):
        return self._filter_tags_in_facet(queryset, 'stem_type')

    def _filter_vase_included(self, queryset, name, value):
        return queryset.filter(vase_included=True) if value == 'true' else queryset

    def _filter_min_price(self, queryset, name, value):
        return queryset.filter(price__gte=int(value) * 100)

    def _filter_max_price(self, queryset, name, value):
        return queryset.filter(price__lte=int(value) * 100)


class TagFilter(django_filters.FilterSet):
    """Filter `/api/tags/` by facet slug or by name search.

    `?facet=<slug>` — restrict to one facet (sidebar / nav-list use).
    `?search=<term>` — case-insensitive name match, restricted to landing-kind
    tags whose page is actually surfaced (`header_title` populated). Used by
    the navbar search bar's autosuggest; non-landing tags are excluded
    because they're not navigable on their own, and landing tags missing
    `header_title` are excluded because their page would render with an empty
    hero — i.e., they're not yet wired up for visitors."""
    facet = django_filters.CharFilter(field_name='facet__slug')
    search = django_filters.CharFilter(method='_filter_search')

    class Meta:
        model = Tag
        fields: list[str] = []

    def _filter_search(self, queryset, name, value):
        return queryset.filter(
            facet__kind='landing',
            header_title__isnull=False,
            name__icontains=value,
        )


class ReviewFilter(django_filters.FilterSet):
    product_slug = django_filters.CharFilter(field_name='product__slug')

    class Meta:
        model = Review
        fields: list[str] = []
