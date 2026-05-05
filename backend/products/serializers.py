from rest_framework import serializers
from .models import Product, Category, Collection, Occasion, Review


class TaxonomySerializer(serializers.ModelSerializer):
    """Shared serializer for the three Taxonomy subclasses (Category, Collection,
    Occasion). Concrete subclasses just point Meta.model at the right model."""
    class Meta:
        fields = ['id', 'name', 'slug', 'image_src', 'page_title', 'header_title', 'header_subtitle', 'nav_img_src', 'nav_description']


class CategorySerializer(TaxonomySerializer):
    class Meta(TaxonomySerializer.Meta):
        model = Category


class CollectionSerializer(TaxonomySerializer):
    class Meta(TaxonomySerializer.Meta):
        model = Collection


class OccasionSerializer(TaxonomySerializer):
    class Meta(TaxonomySerializer.Meta):
        model = Occasion


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
    """Serializer for detailed product view"""
    price_dollars = serializers.ReadOnlyField()
    discounted_price_dollars = serializers.ReadOnlyField()
    categories = CategorySerializer(many=True, read_only=True)
    collections = CollectionSerializer(many=True, read_only=True)
    occasions = OccasionSerializer(many=True, read_only=True)
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
            'categories', 'collections', 'occasions', 'variants', 'created_at', 'updated_at'
        ]

    def get_variants(self, obj):
        return ProductVariantSerializer(obj.variants(), many=True).data