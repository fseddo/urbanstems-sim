# Generated migration to fix variant_type casing in variant objects

from django.db import migrations


def fix_variant_type_casing(apps, schema_editor):
    """
    Update all variant objects to use lowercase variant_type values
    ('single', 'double', 'triple') instead of capitalized ('Single', 'Double', 'Triple').
    This ensures consistency between frontend types and backend data.
    """
    Product = apps.get_model('products', 'Product')

    for product in Product.objects.all():
        # Check if product has variants
        if not product.variants:
            continue

        # Update each variant's variant_type to lowercase
        updated_variants = []
        for variant in product.variants:
            # Create a copy of the variant dict
            updated_variant = variant.copy()

            # Convert variant_type to lowercase if it exists
            if 'variant_type' in updated_variant and updated_variant['variant_type']:
                variant_type = updated_variant['variant_type']
                # Convert 'Single' -> 'single', 'Double' -> 'double', 'Triple' -> 'triple'
                updated_variant['variant_type'] = variant_type.lower()

            updated_variants.append(updated_variant)

        # Save the updated variants
        product.variants = updated_variants
        product.save(update_fields=['variants'])


def reverse_fix_variant_type_casing(apps, schema_editor):
    """
    Revert variant_type to capitalized values when rolling back.
    """
    Product = apps.get_model('products', 'Product')

    for product in Product.objects.all():
        # Check if product has variants
        if not product.variants:
            continue

        # Update each variant's variant_type to capitalized
        updated_variants = []
        for variant in product.variants:
            # Create a copy of the variant dict
            updated_variant = variant.copy()

            # Convert variant_type to capitalized if it exists
            if 'variant_type' in updated_variant and updated_variant['variant_type']:
                variant_type = updated_variant['variant_type']
                # Convert 'single' -> 'Single', 'double' -> 'Double', 'triple' -> 'Triple'
                updated_variant['variant_type'] = variant_type.capitalize()

            updated_variants.append(updated_variant)

        # Save the updated variants
        product.variants = updated_variants
        product.save(update_fields=['variants'])


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0007_update_variant_fields'),
    ]

    operations = [
        migrations.RunPython(fix_variant_type_casing, reverse_fix_variant_type_casing),
    ]
