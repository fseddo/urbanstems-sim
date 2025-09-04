from django.contrib import admin
from .models import Product, Category, Collection, Occasion, ProductCategory, ProductCollection, ProductOccasion, ProductVariation


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
            'fields': ('main_image', 'hover_image')
        }),
        ('Product Details', {
            'fields': ('badge_text', 'delivery_lead_time', 'stock', 'description', 'care_instructions')
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


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Occasion)
class OccasionAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


admin.site.register(ProductCategory)
admin.site.register(ProductCollection)
admin.site.register(ProductOccasion)
admin.site.register(ProductVariation)
