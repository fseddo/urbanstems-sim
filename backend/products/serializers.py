from rest_framework import serializers
from .models import Product, Category, Collection, Occasion


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image_src']


class CollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = ['id', 'name', 'slug', 'image_src']
        


class OccasionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Occasion
        fields = ['id', 'name', 'slug', 'image_src']


class ProductListSerializer(serializers.ModelSerializer):
    """Serializer for product list views with basic info"""
    price_dollars = serializers.ReadOnlyField()
    discounted_price_dollars = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id', 'external_id', 'name', 'variant_type', 'base_name', 'url',
            'price', 'price_dollars', 'discounted_price', 'discounted_price_dollars',
            'main_image', 'hover_image', 'badge_text', 'delivery_lead_time', 'stock',
            'reviews_rating', 'reviews_count', 'variants', 'created_at'
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed product view"""
    price_dollars = serializers.ReadOnlyField()
    discounted_price_dollars = serializers.ReadOnlyField()
    categories = CategorySerializer(many=True, read_only=True)
    collections = CollectionSerializer(many=True, read_only=True) 
    occasions = OccasionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'external_id', 'name', 'variant_type', 'base_name', 'url',
            'price', 'price_dollars', 'discounted_price', 'discounted_price_dollars',
            'main_image', 'hover_image', 'badge_text', 'delivery_lead_time', 'stock',
            'reviews_rating', 'reviews_count', 'description', 'care_instructions',
            'main_detail_src', 'is_main_detail_video', 'detail_image_1_src', 'detail_image_2_src',
            'categories', 'collections', 'occasions', 'variants', 'created_at', 'updated_at'
        ]