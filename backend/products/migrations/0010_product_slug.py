from django.db import migrations, models
from django.utils.text import slugify


def populate_slugs(apps, schema_editor):
    Product = apps.get_model('products', 'Product')
    seen_slugs = set()
    for product in Product.objects.all():
        base_slug = slugify(product.name)
        slug = base_slug
        counter = 2
        while slug in seen_slugs:
            slug = f"{base_slug}-{counter}"
            counter += 1
        seen_slugs.add(slug)
        product.slug = slug
        product.save(update_fields=['slug'])


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0009_product_blur_data_url_alter_product_variants'),
    ]

    operations = [
        # Handle all DB schema changes via raw SQL to avoid Django's
        # deferred _like index creation conflicting with orphaned indexes.
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name='product',
                    name='slug',
                    field=models.SlugField(max_length=200, null=True),
                ),
            ],
            database_operations=[
                migrations.RunSQL(sql=[
                    "DROP INDEX IF EXISTS products_product_slug_70d3148d_like;",
                    "DROP INDEX IF EXISTS products_product_slug_70d3148d;",
                    "ALTER TABLE products_product DROP COLUMN IF EXISTS slug;",
                    "ALTER TABLE products_product ADD COLUMN slug varchar(200);",
                ]),
            ],
        ),
        migrations.RunPython(populate_slugs, migrations.RunPython.noop),
        # Make the column NOT NULL + UNIQUE, and add the pattern ops index
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name='product',
                    name='slug',
                    field=models.SlugField(max_length=200, unique=True),
                ),
            ],
            database_operations=[
                migrations.RunSQL(sql=[
                    "ALTER TABLE products_product ALTER COLUMN slug SET NOT NULL;",
                    "ALTER TABLE products_product ADD CONSTRAINT products_product_slug_key UNIQUE (slug);",
                    "CREATE INDEX products_product_slug_like ON products_product (slug varchar_pattern_ops);",
                ]),
            ],
        ),
    ]
