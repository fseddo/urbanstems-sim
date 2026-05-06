from django.db import models


class VariantType(models.TextChoices):
    SINGLE = "single", "Single"
    DOUBLE = "double", "Double"
    TRIPLE = "triple", "Triple"


class BadgeText(models.TextChoices):
    NEW = "New!", "New!"
    SALE = "Sale", "Sale"
    BEST_SELLER = "Best Seller", "Best Seller"
    LIMITED_TIME_SALE_20_OFF = "Limited Time Sale: 20% Off", "Limited Time Sale: 20% Off"


class FacetKind(models.TextChoices):
    LANDING = "landing", "Landing"   # has its own page (cat/col/occ)
    FILTER = "filter", "Filter"      # only used as a sidebar filter (color/stem_type)


# The 5 facets the project ships. Single source of truth for the seed
# command and any other live-state code that needs to ensure these exist.
# (Past migrations keep their own frozen snapshots — migrations should be
# historically reproducible regardless of how this constant evolves.)
FACET_DEFS: list[tuple[str, str, str]] = [
    ('category',  'Category',  FacetKind.LANDING),
    ('collection', 'Collection', FacetKind.LANDING),
    ('occasion',  'Occasion',  FacetKind.LANDING),
    ('color',     'Color',     FacetKind.FILTER),
    ('stem_type', 'Stem Type', FacetKind.FILTER),
]


class Product(models.Model):
    # Basic product info
    external_id = models.CharField(max_length=50, unique=True, help_text="Original ID from scraped data")
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    variant_type = models.CharField(max_length=10, choices=VariantType.choices, null=True, blank=True)
    base_name = models.CharField(max_length=200)
    url = models.URLField()

    # Pricing (stored in cents)
    price = models.PositiveIntegerField(null=True, blank=True, help_text="Price in cents")
    discounted_price = models.PositiveIntegerField(null=True, blank=True, help_text="Discounted price in cents")

    # Images
    main_image = models.URLField(null=True, blank=True)
    hover_image = models.URLField(null=True, blank=True)
    blur_data_url = models.TextField(null=True, blank=True, help_text="Base64 encoded low-res blur placeholder")

    # Product details
    subtitle = models.CharField(max_length=500, null=True, blank=True)
    badge_text = models.CharField(max_length=30, choices=BadgeText.choices, null=True, blank=True)
    badge_image_src = models.URLField(null=True, blank=True)
    delivery_lead_time = models.PositiveIntegerField(null=True, blank=True, help_text="Lead time in days")
    stock = models.PositiveIntegerField(default=0)

    # Reviews
    reviews_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    reviews_count = models.PositiveIntegerField(null=True, blank=True)

    # Rich text content
    description = models.TextField(null=True, blank=True)
    care_instructions = models.TextField(null=True, blank=True)

    # Detail media
    main_detail_src = models.URLField(null=True, blank=True)
    is_main_detail_video = models.BooleanField(default=False)
    detail_image_1_src = models.URLField(null=True, blank=True)
    detail_image_2_src = models.URLField(null=True, blank=True)

    # Derived flags
    vase_included = models.BooleanField(default=False, help_text="Product comes with a vase/vessel (derived from text at seed time)")

    # Facet membership. Each ProductTag carries `position` for curated
    # ordering within a single landing-kind tag (used by ProductViewSet
    # when ?<facet>=<slug> picks a single tag).
    tags = models.ManyToManyField('Tag', through='ProductTag', related_name='products')

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['variant_type']),
            models.Index(fields=['base_name']),
            models.Index(fields=['price']),
        ]

    def __str__(self):
        return f"{self.name} ({self.variant_type or 'no variant'})"

    @property
    def price_dollars(self):
        """Convert price from cents to dollars"""
        return self.price / 100 if self.price else None

    @property
    def discounted_price_dollars(self):
        """Convert discounted price from cents to dollars"""
        return self.discounted_price / 100 if self.discounted_price else None

    def variants(self) -> list['Product']:
        """Sibling products sharing this product's `base_name` (single/double/
        triple variants of the same bouquet). Includes the product itself —
        the frontend's variant chooser shows all options including the
        currently-selected one.

        Reads from `_variants_cache` if set (the list-view path bulk-fetches
        siblings for the whole page in one query and attaches the cache to
        avoid N+1). Detail-view queries inline — one extra query per render.
        """
        cache = getattr(self, '_variants_cache', None)
        if cache is not None:
            return cache
        return list(
            Product.objects.filter(base_name=self.base_name).order_by('id')
        )


# ---------------------------------------------------------------------------
# Unified facet/tag taxonomy
# ---------------------------------------------------------------------------


class Facet(models.Model):
    """A *dimension of classification* on Product. The project ships 5 facets:
    category, collection, occasion (kind=landing), color, stem_type
    (kind=filter). Each Facet row is the definition; the Tag rows pointing
    at it are the actual classification values.
    """
    slug = models.SlugField(max_length=50, unique=True, help_text="e.g. 'category', 'color'")
    name = models.CharField(max_length=50, help_text="Display name, e.g. 'Category', 'Color'")
    kind = models.CharField(
        max_length=20,
        choices=FacetKind.choices,
        help_text="`landing` = facet whose tags have their own page (cat/col/occ); "
                  "`filter` = filter-only facet (color, stem_type)",
    )

    class Meta:
        ordering = ['slug']

    def __str__(self):
        return self.name


class Tag(models.Model):
    """A single classification value within a Facet ("Birthday" tag of the
    Occasion facet, "Red" tag of the Color facet). All landing-page metadata
    fields are nullable — only landing-kind tags populate them; filter-kind
    tags use slug+name only (color tags also use `hex`).

    Slug uniqueness is per-facet (`peonies` exists as both a category and a
    stem_type tag). URL routing for /collections/<slug> queries with
    `facet__kind='landing'` to keep the landing-tag namespace unambiguous.
    """
    facet = models.ForeignKey(Facet, on_delete=models.CASCADE, related_name='tags')
    slug = models.SlugField(max_length=100)
    name = models.CharField(max_length=100)

    # Landing-page metadata (only populated for landing-kind tags)
    image_src = models.URLField(null=True, blank=True)
    page_title = models.CharField(max_length=500, null=True, blank=True)
    header_title = models.CharField(max_length=500, null=True, blank=True)
    header_subtitle = models.TextField(null=True, blank=True)
    nav_img_src = models.URLField(null=True, blank=True)
    nav_description = models.TextField(null=True, blank=True)

    # Color-specific (only populated when facet=color)
    hex = models.CharField(max_length=7, null=True, blank=True, help_text="Hex color code, e.g. #C97B8E")

    class Meta:
        ordering = ['facet', 'name']
        constraints = [
            models.UniqueConstraint(fields=['facet', 'slug'], name='unique_tag_per_facet'),
        ]
        indexes = [
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return f"{self.facet.slug}/{self.slug}"


class ProductTag(models.Model):
    """M2M join: a tag attached to a product, with curated `position` within
    the tag (used for landing-kind tag pages — color/stem position is kept
    for parity but not currently used for ordering).
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    position = models.PositiveIntegerField(default=0, help_text="Display position within this tag")

    class Meta:
        unique_together = ['product', 'tag']
        ordering = ['position']


class Review(models.Model):
    external_id = models.CharField(max_length=50, unique=True, help_text="Original ID from scraped data")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    reviewer_name = models.CharField(max_length=200)
    is_verified_buyer = models.BooleanField(default=False)
    rating = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=500, null=True, blank=True)
    body = models.TextField(null=True, blank=True)
    date = models.CharField(max_length=20)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.reviewer_name} - {self.title}"
