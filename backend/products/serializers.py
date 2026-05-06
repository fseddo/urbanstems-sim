from rest_framework import serializers
from .models import Product, Review, Facet, Tag


class FacetSerializer(serializers.ModelSerializer):
    """The Facet definition (slug, name, kind). 5 rows total in the DB."""
    class Meta:
        model = Facet
        fields = ['slug', 'name', 'kind']


class TagSerializer(serializers.ModelSerializer):
    """A single tag with its facet nested inline. Landing-page metadata
    fields and `hex` are nullable per facet kind."""
    facet = FacetSerializer(read_only=True)

    class Meta:
        model = Tag
        fields = [
            'id', 'slug', 'name', 'facet',
            'image_src', 'page_title', 'header_title', 'header_subtitle',
            'nav_img_src', 'nav_description',
            'hex',
        ]


class ReviewSerializer(serializers.ModelSerializer):
    product_slug = serializers.SlugRelatedField(
        source='product', slug_field='slug', read_only=True
    )

    class Meta:
        model = Review
        fields = [
            'id', 'external_id', 'product_slug', 'reviewer_name',
            'is_verified_buyer', 'rating', 'title', 'body', 'date'
        ]


class ProductVariantSerializer(serializers.ModelSerializer):
    """Embedded shape for a sibling product within another product's `variants`
    array. Mirrors the frontend `ProductVariant` interface."""
    price_dollars = serializers.ReadOnlyField()
    discounted_price_dollars = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'variant_type',
            'main_image', 'hover_image',
            'delivery_lead_time', 'badge_text', 'badge_image_src',
            'price_dollars', 'discounted_price_dollars',
        ]


class ProductListSerializer(serializers.ModelSerializer):
    """Serializer for product list views with basic info"""
    price_dollars = serializers.ReadOnlyField()
    discounted_price_dollars = serializers.ReadOnlyField()
    variants = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'external_id', 'name', 'slug', 'variant_type', 'base_name', 'url',
            'price', 'price_dollars', 'discounted_price', 'discounted_price_dollars',
            'main_image', 'hover_image', 'blur_data_url', 'subtitle', 'badge_text',
            'badge_image_src', 'delivery_lead_time', 'stock',
            'reviews_rating', 'reviews_count', 'variants', 'created_at'
        ]

    def get_variants(self, obj):
        return ProductVariantSerializer(obj.variants(), many=True).data


class ProductDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed product view. Nested `tags` flow through with
    each tag's facet inline (per `TagSerializer`)."""
    price_dollars = serializers.ReadOnlyField()
    discounted_price_dollars = serializers.ReadOnlyField()
    tags = TagSerializer(many=True, read_only=True)
    variants = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'external_id', 'name', 'slug', 'variant_type', 'base_name', 'url',
            'price', 'price_dollars', 'discounted_price', 'discounted_price_dollars',
            'main_image', 'hover_image', 'blur_data_url', 'subtitle', 'badge_text',
            'badge_image_src', 'delivery_lead_time', 'stock',
            'reviews_rating', 'reviews_count', 'description', 'care_instructions',
            'main_detail_src', 'is_main_detail_video', 'detail_image_1_src', 'detail_image_2_src',
            'tags',
            'variants', 'created_at', 'updated_at'
        ]

    def get_variants(self, obj):
        return ProductVariantSerializer(obj.variants(), many=True).data
