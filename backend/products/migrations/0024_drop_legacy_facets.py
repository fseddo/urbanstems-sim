# Drop the legacy facet tables (Category/Collection/Occasion/StemType/Color)
# and their through-tables (ProductCategory/ProductCollection/ProductOccasion/
# ProductStemType/ProductColor). Also remove the M2M field declarations on
# Product.
#
# Hand-ordered because Django's auto-generated sequence tried to alter
# unique_together AFTER the related fields were removed, which fails with
# `FieldDoesNotExist`. Order here: drop M2M fields on Product (which removes
# the through-table FK references implicitly) → DeleteModel each through →
# DeleteModel each source.
#
# Data has already been copied into Tag/ProductTag by migration 0023; these
# tables are now empty in dev (cleared by `seed_products --clear`) and
# unused everywhere in code.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0023_seed_unified_taxonomy'),
    ]

    operations = [
        # Remove the M2M field declarations on Product. Django removes the
        # through-table FKs and reverse accessors here; the through-tables
        # themselves remain until DeleteModel below.
        migrations.RemoveField(model_name='product', name='categories'),
        migrations.RemoveField(model_name='product', name='collections'),
        migrations.RemoveField(model_name='product', name='occasions'),
        migrations.RemoveField(model_name='product', name='stem_types'),
        migrations.RemoveField(model_name='product', name='colors'),

        # Delete the through-tables. Each handles its own unique_together
        # cleanup in one shot via DeleteModel.
        migrations.DeleteModel(name='ProductCategory'),
        migrations.DeleteModel(name='ProductCollection'),
        migrations.DeleteModel(name='ProductOccasion'),
        migrations.DeleteModel(name='ProductStemType'),
        migrations.DeleteModel(name='ProductColor'),

        # Delete the source tables.
        migrations.DeleteModel(name='Category'),
        migrations.DeleteModel(name='Collection'),
        migrations.DeleteModel(name='Occasion'),
        migrations.DeleteModel(name='StemType'),
        migrations.DeleteModel(name='Color'),
    ]
