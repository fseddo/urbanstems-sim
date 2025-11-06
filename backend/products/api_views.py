from typing import Any, cast
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.request import Request
from .models import Product, Category, Collection, Occasion
from .serializers import (
    ProductListSerializer, ProductDetailSerializer,
    CategorySerializer, CollectionSerializer, OccasionSerializer
)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Product model
    Provides list and detail views
    """
    queryset = Product.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'base_name', 'description']
    ordering_fields = ['name', 'price', 'reviews_rating', 'created_at']
    ordering = ['name']

    def get_serializer_class(self) -> Any:
        if self.action == 'list':
            return ProductListSerializer
        return ProductDetailSerializer

    def get_queryset(self) -> Any:
        queryset = Product.objects.all()
        request = cast(Request, self.request)
        
        # Filter by category
        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(
                productcategory__category__slug=category
            )
        
        # Filter by collection
        collection = request.query_params.get('collection')
        if collection:
            queryset = queryset.filter(
                productcollection__collection__slug=collection
            )
        
        # Filter by occasion
        occasion = request.query_params.get('occasion')
        if occasion:
            queryset = queryset.filter(
                productoccasion__occasion__slug=occasion
            )
        
        # Filter by variant type
        variant_type = request.query_params.get('variant_type')
        if variant_type:
            queryset = queryset.filter(variant_type=variant_type)
        
        # Filter by price range
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=int(min_price) * 100)  # Convert to cents
        if max_price:
            queryset = queryset.filter(price__lte=int(max_price) * 100)  # Convert to cents
        
        return queryset.distinct()


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Category model
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    
    @action(detail=True, methods=['get'])
    def products(self, request, slug=None):
        """Get all products in this category"""
        category = self.get_object()
        products = Product.objects.filter(productcategory__category=category)

        # Apply same filtering as ProductViewSet
        variant_type = request.query_params.get('variant_type')
        if variant_type:
            products = products.filter(variant_type=variant_type)
            
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        if min_price:
            products = products.filter(price__gte=int(min_price) * 100)
        if max_price:
            products = products.filter(price__lte=int(max_price) * 100)
        
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)


class CollectionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Collection model
    """
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializer
    lookup_field = 'slug'
    
    @action(detail=True, methods=['get'])
    def products(self, request, slug=None):
        """Get all products in this collection"""
        collection = self.get_object()
        products = Product.objects.filter(productcollection__collection=collection)
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)


class OccasionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Occasion model
    """
    queryset = Occasion.objects.all()
    serializer_class = OccasionSerializer
    lookup_field = 'slug'
    
    @action(detail=True, methods=['get'])
    def products(self, request, slug=None):
        """Get all products for this occasion"""
        occasion = self.get_object()
        products = Product.objects.filter(productoccasion__occasion=occasion)
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)