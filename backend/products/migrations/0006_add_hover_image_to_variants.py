# Generated migration to add hover_image to variant objects

from django.db import migrations


def add_hover_image_to_variants(apps, schema_editor):
    """
    Add hover_image field to existing variant objects in the variants JSONField.
    Each variant will get the hover_image from its corresponding product.
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

    # For each product, update its variants array to include hover_image
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


def reverse_add_hover_image_to_variants(apps, schema_editor):
    """
    Remove hover_image field from variant objects when rolling back.
    """
    Product = apps.get_model('products', 'Product')

    for product in Product.objects.all():
        # Remove hover_image from each variant object
        variants = product.variants
        for variant in variants:
            if 'hover_image' in variant:
                del variant['hover_image']

        product.variants = variants
        product.save(update_fields=['variants'])


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0005_populate_variants'),
    ]

    operations = [
        migrations.RunPython(add_hover_image_to_variants, reverse_add_hover_image_to_variants),
    ]
