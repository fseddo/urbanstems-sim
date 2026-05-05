from rest_framework import serializers


class LineItemSerializer(serializers.Serializer):
    slug = serializers.SlugField()
    quantity = serializers.IntegerField(min_value=1)


class CreatePaymentIntentSerializer(serializers.Serializer):
    line_items = LineItemSerializer(many=True, allow_empty=False)
