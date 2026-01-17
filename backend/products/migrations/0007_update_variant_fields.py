# Generated migration to update variant objects with additional fields

from django.db import migrations


def update_variant_fields(apps, schema_editor):
    """
    Update variant objects to include:
    - name: actual product name instead of 'Single'/'Double'/'Triple'
    - variant_type: 'Single', 'Double', or 'Triple'
    - delivery_lead_time: from product
    - badge_text: from product
    - price_dollars: from product
    - discounted_price_dollars: from product
    """
    Product = apps.get_model('products', 'Product')

    # Get all products ordered by base_name to group them
    all_products = Product.objects.all().order_by('base_name', 'id')

    # Group products by base_name
    variant_groups = {}
    for product in all_products:
        base_name = product.base_name or product.name
        if base_name not in variant_groups:
            variant_groups[base_name] = []
        variant_groups[base_name].append(product)

    # For each product, update its variants array with the new structure
    for product in all_products:
        base_name = product.base_name or product.name
        variants = []

        # Add all products with the same base_name as variants
        for variant_product in variant_groups[base_name]:
            # Use lowercase variant_type to match backend and frontend types
            variant_type = variant_product.variant_type or 'single'  # Default fallback

            # Calculate price_dollars and discounted_price_dollars
            price_dollars = variant_product.price / 100 if variant_product.price else None
            discounted_price_dollars = variant_product.discounted_price / 100 if variant_product.discounted_price else None

            variants.append({
                'id': variant_product.id,
                'name': variant_product.name,  # Now the actual product name
                'variant_type': variant_type,
                'main_image': variant_product.main_image,
                'hover_image': variant_product.hover_image,
                'delivery_lead_time': variant_product.delivery_lead_time,
                'badge_text': variant_product.badge_text,
                'price_dollars': price_dollars,
                'discounted_price_dollars': discounted_price_dollars,
            })

        # Sort variants by id to ensure consistent ordering
        variants.sort(key=lambda v: v['id'])

        # Update the product with its variants
        product.variants = variants
        product.save(update_fields=['variants'])


def reverse_update_variant_fields(apps, schema_editor):
    """
    Revert to the old variant structure with just id, name, main_image, hover_image.
    """
    Product = apps.get_model('products', 'Product')

    # Get all products ordered by base_name to group them
    all_products = Product.objects.all().order_by('base_name', 'id')

    # Group products by base_name
    variant_groups = {}
    for product in all_products:
        base_name = product.base_name or product.name
        if base_name not in variant_groups:
            variant_groups[base_name] = []
        variant_groups[base_name].append(product)

    # For each product, revert its variants array to the old structure
    for product in all_products:
        base_name = product.base_name or product.name
        variants = []

        # Add all products with the same base_name as variants
        for variant_product in variant_groups[base_name]:
            # Use lowercase variant_type to match backend and frontend types
            variant_type = variant_product.variant_type or 'single'

            variants.append({
                'id': variant_product.id,
                'name': variant_type,
                'main_image': variant_product.main_image,
                'hover_image': variant_product.hover_image
            })

        # Sort variants by id to ensure consistent ordering
        variants.sort(key=lambda v: v['id'])

        # Update the product with its variants
        product.variants = variants
        product.save(update_fields=['variants'])


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0006_add_hover_image_to_variants'),
    ]

    operations = [
        migrations.RunPython(update_variant_fields, reverse_update_variant_fields),
    ]
