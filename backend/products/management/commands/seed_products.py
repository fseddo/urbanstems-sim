import json
import os
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from products.models import (
    Product, Category, Collection, Occasion, 
    ProductCategory, ProductCollection, ProductOccasion,
    ProductVariation, VariantType
)


CATEGORY_IMAGES = {
    'flowers': 'https://urbanstems.com/cdn/shop/files/Flowers_Thumbnail_megamenu.png?v=1744748607&width=64',
    'plants': 'https://urbanstems.com/cdn/shop/files/Plants_Thumbnail_megamenu_2.png?v=1766435002&width=64',
}

OCCASION_IMAGES = {
    'birthday': 'https://urbanstems.com/cdn/shop/files/Birthday_Carousel_295473db-a339-412b-b1e9-14a3946ad435.jpg?v=1771016170&width=600',
    'congratulations': 'https://urbanstems.com/cdn/shop/files/Congrats_Carousel_2ef51173-883a-4ccb-a722-501db21317a5.jpg?v=1771016170&width=600',
    'friendship': 'https://urbanstems.com/cdn/shop/files/Friendship_Carousel_820ba91f-db3c-4486-8ea7-07247b92e13d.jpg?v=1771016170&width=600',
    'just because': 'https://urbanstems.com/cdn/shop/files/JustBecause_Carousel_96cb7f1e-7c6c-4610-a058-2c7ac4683454.jpg?v=1771016170&width=600',
    'sympathy': 'https://urbanstems.com/cdn/shop/files/Sympathy_Carousel_0c67957c-01b7-43ee-a5f6-9e16b13cc6ad.jpg?v=1771016170&width=600',
    'thank you': 'https://urbanstems.com/cdn/shop/files/ThankYou_Carousel_02437d88-54a5-4bb3-860a-66f22f1be6c9.jpg?v=1771016170&width=600',
}


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

            # Derive variant_type from the product's own entry in its variants array
            # (transform_variants.py removed variant_type from the JSON but preserved
            # it as the variant name: "Single", "Double", "Triple", or "Standard")
            own_variant = next(
                (v for v in product_data.get('variants', [])
                 if str(v['id']) == str(product_data['id'])),
                None
            )
            variant_type = own_variant['name'].lower() if own_variant else None

            # Create or get the product
            product, created = Product.objects.get_or_create(
                external_id=product_data['id'],
                defaults={
                    'name': product_data['name'],
                    'slug': slugify(product_data['name']),
                    'variant_type': variant_type,
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
                        defaults={
                            'slug': slugify(category_name),
                            'image_src': CATEGORY_IMAGES.get(category_name, ''),
                        }
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
                        defaults={
                            'slug': slugify(occasion_name),
                            'image_src': OCCASION_IMAGES.get(occasion_name, ''),
                        }
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

        # Populate full variant data from sibling products
        # (the JSON only has minimal variant info: id, name, main_image)
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
                f'Successfully processed {len(products_data)} products\n'
                f'Categories: {Category.objects.count()}\n'
                f'Collections: {Collection.objects.count()}\n'
                f'Occasions: {Occasion.objects.count()}\n'
                f'Product Variations: {ProductVariation.objects.count()}'
            )
        )