from django.contrib import admin
from .models import Product, Review, Facet, Tag, ProductTag


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'variant_type', 'price_dollars', 'stock', 'reviews_rating', 'created_at']
    list_filter = ['variant_type', 'created_at', 'reviews_rating']
    search_fields = ['name', 'base_name', 'external_id']
    readonly_fields = ['external_id', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Info', {
            'fields': ('external_id', 'name', 'variant_type', 'base_name', 'url')
        }),
        ('Pricing', {
            'fields': ('price', 'discounted_price')
        }),
        ('Images', {
            'fields': ('main_image', 'hover_image', 'badge_image_src')
        }),
        ('Product Details', {
            'fields': ('subtitle', 'badge_text', 'delivery_lead_time', 'stock', 'description', 'care_instructions')
        }),
        ('Reviews', {
            'fields': ('reviews_rating', 'reviews_count')
        }),
        ('Detail Media', {
            'fields': ('main_detail_src', 'is_main_detail_video', 'detail_image_1_src', 'detail_image_2_src')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(Facet)
class FacetAdmin(admin.ModelAdmin):
    list_display = ['slug', 'name', 'kind']
    list_filter = ['kind']


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['slug', 'name', 'facet']
    list_filter = ['facet']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


admin.site.register(ProductTag)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['reviewer_name', 'product', 'rating', 'date']
    list_filter = ['rating', 'is_verified_buyer']
    search_fields = ['reviewer_name', 'title', 'body', 'product__slug']
    raw_id_fields = ['product']
