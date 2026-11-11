from rest_framework import serializers

# Upper bounds on an anonymous, public endpoint. Real carts are a handful of
# lines; these just stop a single request from fanning out into a huge DB
# lookup or a PaymentIntent amount Stripe would reject anyway.
MAX_LINE_ITEMS = 50
MAX_QUANTITY_PER_LINE = 99


class LineItemSerializer(serializers.Serializer):
    slug = serializers.SlugField(max_length=255)
    quantity = serializers.IntegerField(min_value=1, max_value=MAX_QUANTITY_PER_LINE)


class CreatePaymentIntentSerializer(serializers.Serializer):
    line_items = LineItemSerializer(many=True, allow_empty=False)

    def validate_line_items(self, value):
        if len(value) > MAX_LINE_ITEMS:
            raise serializers.ValidationError(
                f'Too many line items (max {MAX_LINE_ITEMS}).'
            )
        return value
