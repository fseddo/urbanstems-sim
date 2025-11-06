from django.db import models


class VariantType(models.TextChoices):
    SINGLE = "single", "Single"
    DOUBLE = "double", "Double" 
    TRIPLE = "triple", "Triple"


class Product(models.Model):
    # Basic product info
    external_id = models.CharField(max_length=50, unique=True, help_text="Original ID from scraped data")
    name = models.CharField(max_length=200)
    variant_type = models.CharField(max_length=10, choices=VariantType.choices, null=True, blank=True)
    base_name = models.CharField(max_length=200)
    url = models.URLField()
    
    # Pricing (stored in cents)
    price = models.PositiveIntegerField(null=True, blank=True, help_text="Price in cents")
    discounted_price = models.PositiveIntegerField(null=True, blank=True, help_text="Discounted price in cents")
    
    # Images
    main_image = models.URLField(null=True, blank=True)
    hover_image = models.URLField(null=True, blank=True)
    
    # Product details
    badge_text = models.CharField(max_length=100, null=True, blank=True)
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

    @property
    def categories(self):
        """Get all categories for this product"""
        return Category.objects.filter(productcategory__product=self)
    
    @property
    def collections(self):
        """Get all collections for this product"""
        return Collection.objects.filter(productcollection__product=self)
    
    @property
    def occasions(self):
        """Get all occasions for this product"""
        return Occasion.objects.filter(productoccasion__product=self)


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    image_src = models.URLField(null=True, blank=True, help_text="Category image URL")

    class Meta:
        verbose_name_plural = "categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class Collection(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    image_src = models.URLField(null=True, blank=True, help_text="Category image URL")

    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Occasion(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    image_src = models.URLField(null=True, blank=True, help_text="Occasion image URL")

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class ProductCategory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ['product', 'category']


class ProductCollection(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ['product', 'collection']


class ProductOccasion(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    occasion = models.ForeignKey(Occasion, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ['product', 'occasion']


class ProductVariation(models.Model):
    """Links product variations together"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    single_variation = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, related_name="single_variants")
    double_variation = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, related_name="double_variants")
    triple_variation = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, related_name="triple_variants")
    
    class Meta:
        unique_together = ['product']
