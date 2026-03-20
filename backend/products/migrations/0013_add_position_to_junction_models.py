from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0012_category_header_subtitle_category_header_title_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='productcategory',
            name='position',
            field=models.PositiveIntegerField(default=0, help_text='Display position within this category'),
        ),
        migrations.AddField(
            model_name='productcollection',
            name='position',
            field=models.PositiveIntegerField(default=0, help_text='Display position within this collection'),
        ),
        migrations.AddField(
            model_name='productoccasion',
            name='position',
            field=models.PositiveIntegerField(default=0, help_text='Display position within this occasion'),
        ),
        migrations.AlterModelOptions(
            name='productcategory',
            options={'ordering': ['position']},
        ),
        migrations.AlterModelOptions(
            name='productcollection',
            options={'ordering': ['position']},
        ),
        migrations.AlterModelOptions(
            name='productoccasion',
            options={'ordering': ['position']},
        ),
    ]
