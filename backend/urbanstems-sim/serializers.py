from rest_framework import serializers
from .models import Flower, AddOnItem

class FlowerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flower
        fields = (
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
        


class AddOnItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = AddOnItem
        fields = (
            'name', 
            'price', 
            'image_url', 
            'description', 
            'amount_in_stock',
        )