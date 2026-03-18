from django.db import migrations


def add_slug_to_variants(apps, schema_editor):
    """Add slug field to each variant object in the variants JSON array."""
    Product = apps.get_model('products', 'Product')

    # Build a lookup of product id -> slug
    slug_lookup = dict(Product.objects.values_list('id', 'slug'))

    for product in Product.objects.exclude(variants=[]):
        updated = False
        for variant in product.variants:
            slug = slug_lookup.get(variant['id'])
            if slug and variant.get('slug') != slug:
                variant['slug'] = slug
                updated = True
        if updated:
            product.save(update_fields=['variants'])


def remove_slug_from_variants(apps, schema_editor):
    """Remove slug field from variant objects."""
    Product = apps.get_model('products', 'Product')

    for product in Product.objects.exclude(variants=[]):
        updated = False
        for variant in product.variants:
            if 'slug' in variant:
                del variant['slug']
                updated = True
        if updated:
            product.save(update_fields=['variants'])


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0010_product_slug'),
    ]

    operations = [
        migrations.RunPython(add_slug_to_variants, remove_slug_from_variants),
    ]
