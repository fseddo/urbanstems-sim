import json
import os
import re
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from products.models import (
    Product, Category, Collection, Occasion, Review,
    ProductCategory, ProductCollection, ProductOccasion,
    ProductVariation
)


def strip_width_param(url):
    """Remove &width=N from image URLs."""
    if not url:
        return url
    return re.sub(r'&width=\d+', '', url)


class Command(BaseCommand):
    help = 'Seed database with products from products_new.json'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='data/products_new.json',
            help='Path to the products JSON file (default: data/products_new.json)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding'
        )

    def handle(self, *args, **options):
        file_path = options['file']

        if not os.path.exists(file_path):
            self.stdout.write(
                self.style.ERROR(f'File not found: {file_path}')
            )
            return

        # Clear existing data if requested
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            Review.objects.all().delete()
            ProductVariation.objects.all().delete()
            ProductCategory.objects.all().delete()
            ProductCollection.objects.all().delete()
            ProductOccasion.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            Collection.objects.all().delete()
            Occasion.objects.all().delete()

        # Load JSON data
        self.stdout.write(f'Loading data from {file_path}...')
        with open(file_path, 'r') as f:
            data = json.load(f)

        products_data = data['products']
        collections_data = data.get('collections', [])
        occasions_data = data.get('occasions', [])
        categories_data = data.get('categories', [])

        self.stdout.write(f'Found {len(products_data)} products, {len(collections_data)} collections, {len(occasions_data)} occasions, {len(categories_data)} categories')

        # Seed categories, collections, occasions from their dedicated arrays
        categories_cache = {}
        for cat in categories_data:
            category, _ = Category.objects.get_or_create(
                name=cat['name'],
                defaults={
                    'slug': slugify(cat['name']),
                    'image_src': strip_width_param(cat.get('image_src')),
                    'page_title': cat.get('page_title'),
                    'header_title': cat.get('header_title'),
                    'header_subtitle': cat.get('header_subtitle'),
                }
            )
            categories_cache[cat['name']] = category
        self.stdout.write(f'  Seeded {len(categories_cache)} categories')

        collections_cache = {}
        for col in collections_data:
            collection, _ = Collection.objects.get_or_create(
                name=col['name'],
                defaults={
                    'slug': slugify(col['name']),
                    'image_src': strip_width_param(col.get('image_src')),
                    'page_title': col.get('page_title'),
                    'header_title': col.get('header_title'),
                    'header_subtitle': col.get('header_subtitle'),
                }
            )
            collections_cache[col['name']] = collection
        self.stdout.write(f'  Seeded {len(collections_cache)} collections')

        occasions_cache = {}
        for occ in occasions_data:
            occasion, _ = Occasion.objects.get_or_create(
                name=occ['name'],
                defaults={
                    'slug': slugify(occ['name']),
                    'image_src': strip_width_param(occ.get('image_src')),
                    'page_title': occ.get('page_title'),
                    'header_title': occ.get('header_title'),
                    'header_subtitle': occ.get('header_subtitle'),
                }
            )
            occasions_cache[occ['name']] = occasion
        self.stdout.write(f'  Seeded {len(occasions_cache)} occasions')

        # Create products
        created_products = {}
        for product_data in products_data:
            self.stdout.write(f'Processing: {product_data["name"]}')

            product, created = Product.objects.get_or_create(
                external_id=product_data['id'],
                defaults={
                    'name': product_data['name'],
                    'slug': slugify(product_data['name']),
                    'variant_type': product_data.get('variant_type'),
                    'base_name': product_data['base_name'],
                    'url': product_data['url'],
                    'price': product_data.get('price'),
                    'discounted_price': product_data.get('discounted_price'),
                    'main_image': strip_width_param(product_data.get('main_image')),
                    'hover_image': strip_width_param(product_data.get('hover_image')),
                    'subtitle': product_data.get('subtitle'),
                    'badge_text': product_data.get('badge_text'),
                    'badge_image_src': strip_width_param(product_data.get('badge_image_src')),
                    'delivery_lead_time': product_data.get('delivery_lead_time'),
                    'stock': product_data.get('stock', 0),
                    'reviews_rating': product_data.get('reviews_rating'),
                    'reviews_count': product_data.get('reviews_count'),
                    'description': product_data.get('description'),
                    'care_instructions': product_data.get('care_instructions'),
                    'main_detail_src': strip_width_param(product_data.get('main_detail_src')),
                    'is_main_detail_video': product_data.get('is_main_detail_video', False),
                    'detail_image_1_src': strip_width_param(product_data.get('detail_image_1_src')),
                    'detail_image_2_src': strip_width_param(product_data.get('detail_image_2_src')),
                }
            )

            created_products[product_data['id']] = product

            if created:
                self.stdout.write(f'  Created: {product.name}')
            else:
                self.stdout.write(f'  Already exists: {product.name}')

            # Link categories
            for category_name in product_data.get('categories', []):
                if category_name in categories_cache:
                    ProductCategory.objects.get_or_create(
                        product=product,
                        category=categories_cache[category_name]
                    )

            # Link collections
            for collection_name in product_data.get('collections', []):
                if collection_name in collections_cache:
                    ProductCollection.objects.get_or_create(
                        product=product,
                        collection=collections_cache[collection_name]
                    )

            # Link occasions
            for occasion_name in product_data.get('occasions', []):
                if occasion_name in occasions_cache:
                    ProductOccasion.objects.get_or_create(
                        product=product,
                        occasion=occasions_cache[occasion_name]
                    )

            # Create reviews
            for review_data in product_data.get('reviews', []):
                Review.objects.get_or_create(
                    external_id=review_data['id'],
                    defaults={
                        'product': product,
                        'reviewer_name': review_data['reviewer_name'],
                        'is_verified_buyer': review_data.get('is_verified_buyer', False),
                        'rating': review_data['rating'],
                        'title': review_data.get('title'),
                        'body': review_data.get('body'),
                        'date': review_data.get('date', ''),
                    }
                )

        # Handle product variations
        self.stdout.write('Processing product variations...')
        for product_data in products_data:
            product = created_products[product_data['id']]

            variation_data = {}

            if product_data.get('single_variation') and product_data['single_variation'] in created_products:
                variation_data['single_variation'] = created_products[product_data['single_variation']]

            if product_data.get('double_variation') and product_data['double_variation'] in created_products:
                variation_data['double_variation'] = created_products[product_data['double_variation']]

            if product_data.get('triple_variation') and product_data['triple_variation'] in created_products:
                variation_data['triple_variation'] = created_products[product_data['triple_variation']]

            if variation_data:
                ProductVariation.objects.update_or_create(
                    product=product,
                    defaults=variation_data
                )

        # Populate full variant data from sibling products
        self.stdout.write('Populating variant data...')
        all_products = Product.objects.all().order_by('base_name', 'id')

        variant_groups = {}
        for product in all_products:
            base_name = product.base_name or product.name
            variant_groups.setdefault(base_name, []).append(product)

        for product in all_products:
            base_name = product.base_name or product.name
            siblings = variant_groups[base_name]

            variants = []
            for sibling in siblings:
                variant_type = sibling.variant_type or 'single'
                price_dollars = sibling.price / 100 if sibling.price else None
                discounted_price_dollars = sibling.discounted_price / 100 if sibling.discounted_price else None

                variants.append({
                    'id': sibling.id,
                    'name': sibling.name,
                    'slug': sibling.slug,
                    'variant_type': variant_type,
                    'main_image': sibling.main_image,
                    'hover_image': sibling.hover_image,
                    'delivery_lead_time': sibling.delivery_lead_time,
                    'badge_text': sibling.badge_text,
                    'price_dollars': price_dollars,
                    'discounted_price_dollars': discounted_price_dollars,
                })

            variants.sort(key=lambda v: v['id'])
            product.variants = variants
            product.save(update_fields=['variants'])

        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully seeded:\n'
                f'  Products: {Product.objects.count()}\n'
                f'  Categories: {Category.objects.count()}\n'
                f'  Collections: {Collection.objects.count()}\n'
                f'  Occasions: {Occasion.objects.count()}\n'
                f'  Reviews: {Review.objects.count()}\n'
                f'  Product Variations: {ProductVariation.objects.count()}'
            )
        )
