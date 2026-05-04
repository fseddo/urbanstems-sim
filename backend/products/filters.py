import django_filters

from .models import Product, Review


class ProductFilter(django_filters.FilterSet):
    # Single-slug taxonomy. The viewset reads these to decide position ordering
    # when no explicit `?ordering=` is supplied.
    category = django_filters.CharFilter(field_name='productcategory__category__slug')
    collection = django_filters.CharFilter(field_name='productcollection__collection__slug')
    occasion = django_filters.CharFilter(field_name='productoccasion__occasion__slug')

    # Multi-select sent as repeated params (?categories=a&categories=b). django-filter's
    # BaseInFilter expects comma-separated, so we use method filters that re-read getlist.
    categories = django_filters.CharFilter(method='_filter_in_categories')
    stem_types = django_filters.CharFilter(method='_filter_in_stem_types')
    colors = django_filters.CharFilter(method='_filter_in_colors')

    # Boolean opt-in: only filter when value is exactly 'true' (preserves prior behavior).
    vase_included = django_filters.CharFilter(method='_filter_vase_included')

    badge_text = django_filters.CharFilter(field_name='badge_text')
    variant_type = django_filters.CharFilter(field_name='variant_type')

    # Price input is in dollars; stored as cents.
    min_price = django_filters.NumberFilter(method='_filter_min_price')
    max_price = django_filters.NumberFilter(method='_filter_max_price')

    class Meta:
        model = Product
        fields: list[str] = []

    def _multi(self, queryset, param, lookup):
        slugs = self.request.GET.getlist(param) if self.request else []
        return queryset.filter(**{lookup: slugs}) if slugs else queryset

    def _filter_in_categories(self, queryset, name, value):
        return self._multi(queryset, 'categories', 'productcategory__category__slug__in')

    def _filter_in_stem_types(self, queryset, name, value):
        return self._multi(queryset, 'stem_types', 'productstemtype__stem_type__slug__in')

    def _filter_in_colors(self, queryset, name, value):
        return self._multi(queryset, 'colors', 'productcolor__color__slug__in')

    def _filter_vase_included(self, queryset, name, value):
        return queryset.filter(vase_included=True) if value == 'true' else queryset

    def _filter_min_price(self, queryset, name, value):
        return queryset.filter(price__gte=int(value) * 100)

    def _filter_max_price(self, queryset, name, value):
        return queryset.filter(price__lte=int(value) * 100)


class ReviewFilter(django_filters.FilterSet):
    product_slug = django_filters.CharFilter(field_name='product__slug')

    class Meta:
        model = Review
        fields: list[str] = []
