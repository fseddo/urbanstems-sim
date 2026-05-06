# Data migration: consolidate Category / Collection / Occasion / Color /
# StemType into the unified Facet + Tag tables, and copy each through-table's
# rows (with `position` preserved) into ProductTag.
#
# The legacy tables stay alive in parallel until phase 4. This migration is
# read-only against them; safe to re-run via reverse + re-apply during dev.

from django.db import migrations


# Facet seed: (slug, name, kind). Order matters only for deterministic IDs.
FACET_DEFS = [
    ('category',  'Category',  'landing'),
    ('collection', 'Collection', 'landing'),
    ('occasion',  'Occasion',  'landing'),
    ('color',     'Color',     'filter'),
    ('stem_type', 'Stem Type', 'filter'),
]


# Per source-model: (legacy model name, facet slug, fields-to-copy mapping).
# Field map is {tag_field: source_attr}. Filter-kind tags omit landing
# metadata; color tags include `hex`.
SOURCE_MODELS = [
    ('Category', 'category', {
        'image_src': 'image_src',
        'page_title': 'page_title',
        'header_title': 'header_title',
        'header_subtitle': 'header_subtitle',
        'nav_img_src': 'nav_img_src',
        'nav_description': 'nav_description',
    }),
    ('Collection', 'collection', {
        'image_src': 'image_src',
        'page_title': 'page_title',
        'header_title': 'header_title',
        'header_subtitle': 'header_subtitle',
        'nav_img_src': 'nav_img_src',
        'nav_description': 'nav_description',
    }),
    ('Occasion', 'occasion', {
        'image_src': 'image_src',
        'page_title': 'page_title',
        'header_title': 'header_title',
        'header_subtitle': 'header_subtitle',
        'nav_img_src': 'nav_img_src',
        'nav_description': 'nav_description',
    }),
    ('Color', 'color', {'hex': 'hex'}),
    ('StemType', 'stem_type', {}),
]


# Per through-model: (through model name, source-row attr name on the
# through row, source legacy model — for source_id → tag_id resolution).
THROUGH_MODELS = [
    ('ProductCategory', 'category', 'Category'),
    ('ProductCollection', 'collection', 'Collection'),
    ('ProductOccasion', 'occasion', 'Occasion'),
    ('ProductColor', 'color', 'Color'),
    ('ProductStemType', 'stem_type', 'StemType'),
]


def seed_unified_taxonomy(apps, schema_editor):
    Facet = apps.get_model('products', 'Facet')
    Tag = apps.get_model('products', 'Tag')
    ProductTag = apps.get_model('products', 'ProductTag')

    # 1. Seed Facet rows
    facets_by_slug = {}
    for slug, name, kind in FACET_DEFS:
        facet, _ = Facet.objects.get_or_create(
            slug=slug, defaults={'name': name, 'kind': kind}
        )
        facets_by_slug[slug] = facet

    # 2. Copy rows from each legacy table into Tag, indexed by
    #    (legacy_model_name, legacy_pk) -> Tag instance for through-row resolution.
    legacy_to_tag = {}
    for model_name, facet_slug, field_map in SOURCE_MODELS:
        Model = apps.get_model('products', model_name)
        facet = facets_by_slug[facet_slug]
        for row in Model.objects.all():
            tag_kwargs = {
                'facet': facet,
                'slug': row.slug,
                'name': row.name,
            }
            for tag_field, src_attr in field_map.items():
                tag_kwargs[tag_field] = getattr(row, src_attr)
            tag, _ = Tag.objects.get_or_create(
                facet=facet, slug=row.slug, defaults=tag_kwargs
            )
            legacy_to_tag[(model_name, row.pk)] = tag

    # 3. Copy through-rows into ProductTag, preserving `position`.
    for through_name, src_attr, src_model in THROUGH_MODELS:
        Through = apps.get_model('products', through_name)
        for row in Through.objects.all():
            src_obj = getattr(row, src_attr)
            tag = legacy_to_tag.get((src_model, src_obj.pk))
            if tag is None:
                continue  # source row not present in legacy_to_tag (shouldn't happen)
            ProductTag.objects.update_or_create(
                product=row.product,
                tag=tag,
                defaults={'position': row.position},
            )


def unseed_unified_taxonomy(apps, schema_editor):
    # Reverse: drop everything we created. Legacy tables are untouched.
    apps.get_model('products', 'ProductTag').objects.all().delete()
    apps.get_model('products', 'Tag').objects.all().delete()
    apps.get_model('products', 'Facet').objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0022_add_facet_tag_producttag'),
    ]

    operations = [
        migrations.RunPython(seed_unified_taxonomy, reverse_code=unseed_unified_taxonomy),
    ]
