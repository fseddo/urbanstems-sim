import json
import os
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from products.models import (
    Product, Category, Collection, Occasion, 
    ProductCategory, ProductCollection, ProductOccasion,
    ProductVariation, VariantType
)


class Command(BaseCommand):
    help = 'Seed database with products from products.json'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='data/products.json',
            help='Path to the products JSON file (default: data/products.json)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding'
        )

    def handle(self, *args, **options):
        file_path = options['file']
        
        # Check if file exists
        if not os.path.exists(file_path):
            self.stdout.write(
                self.style.ERROR(f'File not found: {file_path}')
            )
            return

        # Clear existing data if requested
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            ProductVariation.objects.all().delete()
            ProductCategory.objects.all().delete()
            ProductCollection.objects.all().delete()
            ProductOccasion.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            Collection.objects.all().delete()
            Occasion.objects.all().delete()

        # Load JSON data
        self.stdout.write(f'Loading products from {file_path}...')
        with open(file_path, 'r') as f:
            products_data = json.load(f)

        self.stdout.write(f'Found {len(products_data)} products to process')

        # Keep track of created objects for variations
        created_products = {}
        categories_cache = {}
        collections_cache = {}
        occasions_cache = {}

        # Create products
        for product_data in products_data:
            self.stdout.write(f'Processing: {product_data["name"]}')
            
            # Create or get the product
            product, created = Product.objects.get_or_create(
                external_id=product_data['id'],
                defaults={
                    'name': product_data['name'],
                    'variant_type': product_data.get('variant_type'),
                    'base_name': product_data['base_name'],
                    'url': product_data['url'],
                    'price': product_data.get('price'),
                    'discounted_price': product_data.get('discounted_price'),
                    'main_image': product_data.get('main_image'),
                    'hover_image': product_data.get('hover_image'),
                    'badge_text': product_data.get('badge_text'),
                    'delivery_lead_time': product_data.get('delivery_lead_time'),
                    'stock': product_data.get('stock', 0),
                    'reviews_rating': product_data.get('reviews_rating'),
                    'reviews_count': product_data.get('reviews_count'),
                    'description': product_data.get('description'),
                    'care_instructions': product_data.get('care_instructions'),
                    'main_detail_src': product_data.get('main_detail_src'),
                    'is_main_detail_video': product_data.get('is_main_detail_video', False),
                    'detail_image_1_src': product_data.get('detail_image_1_src'),
                    'detail_image_2_src': product_data.get('detail_image_2_src'),
                    'variants': product_data.get('variants', []),
                }
            )
            
            created_products[product_data['id']] = product
            
            if created:
                self.stdout.write(f'  Created: {product.name}')
            else:
                self.stdout.write(f'  Updated: {product.name}')

            # Handle categories
            for category_name in product_data.get('categories', []):
                if category_name not in categories_cache:
                    category, _ = Category.objects.get_or_create(
                        name=category_name,
                        defaults={'slug': slugify(category_name)}
                    )
                    categories_cache[category_name] = category
                
                category = categories_cache[category_name]
                ProductCategory.objects.get_or_create(
                    product=product,
                    category=category
                )

            # Handle collections
            for collection_name in product_data.get('collections', []):
                if collection_name not in collections_cache:
                    collection, _ = Collection.objects.get_or_create(
                        name=collection_name,
                        defaults={'slug': slugify(collection_name)}
                    )
                    collections_cache[collection_name] = collection
                
                collection = collections_cache[collection_name]
                ProductCollection.objects.get_or_create(
                    product=product,
                    collection=collection
                )

            # Handle occasions
            for occasion_name in product_data.get('occasions', []):
                if occasion_name not in occasions_cache:
                    occasion, _ = Occasion.objects.get_or_create(
                        name=occasion_name,
                        defaults={'slug': slugify(occasion_name)}
                    )
                    occasions_cache[occasion_name] = occasion
                
                occasion = occasions_cache[occasion_name]
                ProductOccasion.objects.get_or_create(
                    product=product,
                    occasion=occasion
                )

        # Handle product variations
        self.stdout.write('Processing product variations...')
        for product_data in products_data:
            product = created_products[product_data['id']]
            
            variation_data = {}
            
            # Map variation references
            if 'single_variation' in product_data and product_data['single_variation']:
                if product_data['single_variation'] in created_products:
                    variation_data['single_variation'] = created_products[product_data['single_variation']]
            
            if 'double_variation' in product_data and product_data['double_variation']:
                if product_data['double_variation'] in created_products:
                    variation_data['double_variation'] = created_products[product_data['double_variation']]
            
            if 'triple_variation' in product_data and product_data['triple_variation']:
                if product_data['triple_variation'] in created_products:
                    variation_data['triple_variation'] = created_products[product_data['triple_variation']]

            # Create variation mapping if we have any variations
            if variation_data:
                ProductVariation.objects.update_or_create(
                    product=product,
                    defaults=variation_data
                )

        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed {len(products_data)} products\n'
                f'Categories: {Category.objects.count()}\n'
                f'Collections: {Collection.objects.count()}\n'
                f'Occasions: {Occasion.objects.count()}\n'
                f'Product Variations: {ProductVariation.objects.count()}'
            )
        )