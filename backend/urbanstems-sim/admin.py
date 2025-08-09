from django.contrib import admin
from .models import Flower, AddOnItem

class FlowerAdmin(admin.ModelAdmin):
    list_display = (
            'name', 
            'occasion', 
            'collection', 
            'price', 
            'image_urls', 
            'description', 
            'details', 
            'pet_safe',
            'is_single_variety',
            'discount',
            'amount_in_stock',
            'delivery_lead_time',
            'type'
        )
    

class AddOnItemAdmin(admin.ModelAdmin):
    list_display = (
         'name', 
        'price', 
        'image_url', 
        'description', 
        'amount_in_stock',
    )

# Register your models here.
admin.site.register(Flower, FlowerAdmin)
admin.site.register(AddOnItem, AddOnItemAdmin)

