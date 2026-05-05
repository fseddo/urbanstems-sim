from django.db import models


class VariantType(models.TextChoices):
    SINGLE = "single", "Single"
    DOUBLE = "double", "Double" 
    TRIPLE = "triple", "Triple"


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
    badge_text = models.CharField(max_length=100, null=True, blank=True)
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

    # Taxonomy memberships. Each through-model carries a `position` field for
    # curated ordering within a single category/collection/occasion (used by
    # ProductViewSet's position-ordering when ?category=foo etc. is set).
    # Consumers wanting a product's tag set use the manager: product.categories.all().
    # Consumers wanting "members of this category in curated order" query the
    # through-model directly: queryset.order_by('productcategory__position').
    categories = models.ManyToManyField('Category', through='ProductCategory', related_name='products')
    collections = models.ManyToManyField('Collection', through='ProductCollection', related_name='products')
    occasions = models.ManyToManyField('Occasion', through='ProductOccasion', related_name='products')
    stem_types = models.ManyToManyField('StemType', through='ProductStemType', related_name='products')
    colors = models.ManyToManyField('Color', through='ProductColor', related_name='products')

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


class Taxonomy(models.Model):
    """Shared schema for taxonomy-like models (Category, Collection, Occasion).

    Each is a tag set products belong to via a through-model with a `position`
    field for curated ordering. Fields and Meta.ordering are identical; only
    the table and verbose names differ.
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    image_src = models.URLField(null=True, blank=True, help_text="Image URL")
    page_title = models.CharField(max_length=500, null=True, blank=True)
    header_title = models.CharField(max_length=500, null=True, blank=True)
    header_subtitle = models.TextField(null=True, blank=True)
    nav_img_src = models.URLField(null=True, blank=True)
    nav_description = models.TextField(null=True, blank=True)

    class Meta:
        abstract = True
        ordering = ['name']

    def __str__(self):
        return self.name


class Category(Taxonomy):
    class Meta(Taxonomy.Meta):
        verbose_name_plural = "categories"


class Collection(Taxonomy):
    pass


class Occasion(Taxonomy):
    pass


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


class ProductCategory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    position = models.PositiveIntegerField(default=0, help_text="Display position within this category")

    class Meta:
        unique_together = ['product', 'category']
        ordering = ['position']


class ProductCollection(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE)
    position = models.PositiveIntegerField(default=0, help_text="Display position within this collection")

    class Meta:
        unique_together = ['product', 'collection']
        ordering = ['position']


class ProductOccasion(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    occasion = models.ForeignKey(Occasion, on_delete=models.CASCADE)
    position = models.PositiveIntegerField(default=0, help_text="Display position within this occasion")

    class Meta:
        unique_together = ['product', 'occasion']
        ordering = ['position']


class StemType(models.Model):
    """A type of flower/stem that can appear in a bouquet (e.g. Roses, Peonies).

    Derived from product text during seeding — not scraped directly.
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Color(models.Model):
    """A color tag for a product (e.g. Pink, White, Assorted).

    Derived from product text during seeding. `hex` is used by the UI for
    swatches.
    """
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)
    hex = models.CharField(max_length=7, null=True, blank=True, help_text="Hex color code, e.g. #C97B8E")

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class ProductStemType(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    stem_type = models.ForeignKey(StemType, on_delete=models.CASCADE)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ['product', 'stem_type']
        ordering = ['position']


class ProductColor(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    color = models.ForeignKey(Color, on_delete=models.CASCADE)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ['product', 'color']
        ordering = ['position']


class ProductVariation(models.Model):
    """Links product variations together"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    single_variation = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, related_name="single_variants")
    double_variation = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, related_name="double_variants")
    triple_variation = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, related_name="triple_variants")
    
    class Meta:
        unique_together = ['product']
