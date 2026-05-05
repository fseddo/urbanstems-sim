import json
import os
import re
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from products.models import (
    Product, Category, Collection, Occasion, Review,
    ProductCategory, ProductCollection, ProductOccasion,
    StemType, Color, ProductStemType, ProductColor,
)


# Canonical stem-type vocabulary. Each key is a slug; `variants` are the
# case-insensitive whole-word tokens matched in product text. Order is
# longest-first so 'garden rose' matches before 'rose' can greedily claim it;
# products matching both stay tagged with both (garden roses ARE roses).
STEM_VOCAB = {
    'garden-roses': {'name': 'Garden Roses', 'variants': ['garden roses', 'garden rose']},
    'roses':        {'name': 'Roses',        'variants': ['roses', 'rose']},
    'anemones':     {'name': 'Anemones',     'variants': ['anemones', 'anemone']},
    'carnations':   {'name': 'Carnations',   'variants': ['carnations', 'carnation']},
    'delphinium':   {'name': 'Delphinium',   'variants': ['delphiniums', 'delphinium']},
    'eucalyptus':   {'name': 'Eucalyptus',   'variants': ['eucalyptus']},
    'lilies':       {'name': 'Lilies',       'variants': ['lilies', 'lily']},
    'marigolds':    {'name': 'Marigolds',    'variants': ['marigolds', 'marigold']},
    # 'mum' alone would false-positive on Mother's-Day copy
    'mums':         {'name': 'Mums',         'variants': ['chrysanthemums', 'chrysanthemum', 'mums']},
    'peonies':      {'name': 'Peonies',      'variants': ['peonies', 'peony']},
    'ranunculus':   {'name': 'Ranunculus',   'variants': ['ranunculus']},
    'sunflowers':   {'name': 'Sunflowers',   'variants': ['sunflowers', 'sunflower']},
    'tulips':       {'name': 'Tulips',       'variants': ['tulips', 'tulip']},
    'scabiosa':     {'name': 'Scabiosa',     'variants': ['scabiosa']},
    'hydrangea':    {'name': 'Hydrangea',    'variants': ['hydrangeas', 'hydrangea']},
}


# Color vocabulary — keys match what the UI filter sidebar expects.
# 'assorted' has no direct-match variants; it's derived from products that
# match 3+ distinct colors.
COLOR_VOCAB = {
    'beige':    {'name': 'Beige',    'hex': '#E8D9B6', 'variants': ['beige', 'cream', 'ivory']},
    'blue':     {'name': 'Blue',     'hex': '#6B85A3', 'variants': ['blue']},
    'green':    {'name': 'Green',    'hex': '#A3B58F', 'variants': ['green']},
    'orange':   {'name': 'Orange',   'hex': '#E09457', 'variants': ['orange']},
    'peach':    {'name': 'Peach',    'hex': '#F0C9A8', 'variants': ['peach']},
    'pink':     {'name': 'Pink',     'hex': '#C97B8E', 'variants': ['pink', 'blush']},
    'purple':   {'name': 'Purple',   'hex': '#B39DBF', 'variants': ['purple', 'violet', 'lavender', 'lilac']},
    'red':      {'name': 'Red',      'hex': '#A34545', 'variants': ['red', 'burgundy', 'crimson']},
    'white':    {'name': 'White',    'hex': '#FFFFFF', 'variants': ['white']},
    'yellow':   {'name': 'Yellow',   'hex': '#E6C85A', 'variants': ['yellow', 'gold', 'golden']},
    'metallic': {'name': 'Metallic', 'hex': '#C0C0C0', 'variants': ['metallic']},
    'assorted': {'name': 'Assorted', 'hex': None,      'variants': []},
}

# Products matching this many distinct colors also get tagged 'assorted'.
ASSORTED_COLOR_THRESHOLD = 3


def match_vocab(text, vocab):
    """Return slugs from `vocab` whose variants appear as whole words in `text`."""
    if not text:
        return []
    text_lower = text.lower()
    matched = []
    for slug, entry in vocab.items():
        for variant in entry['variants']:
            if re.search(r'\b' + re.escape(variant) + r'\b', text_lower):
                matched.append(slug)
                break
    return matched


# Any comma/period/HTML-separated clause containing one of these words
# describes a container, not a flower. We drop those clauses before color
# scanning so e.g. "Pink Anthurium, Pink and White Ceramic Vessel Included"
# tags only 'pink' (from the plant), not 'white' (from the vase).
CONTAINER_WORDS_RE = re.compile(
    r'\b(vase|vessel|pot|planter|container|jar|urn|bowl|vase\'s)\b',
    re.IGNORECASE,
)
CLAUSE_SPLIT_RE = re.compile(r'[,.]|<\/?p>|<br\s*\/?>', re.IGNORECASE)


def strip_container_clauses(text):
    """Drop clauses that describe a container so their colors aren't tagged."""
    if not text:
        return text
    clauses = CLAUSE_SPLIT_RE.split(text)
    kept = [c for c in clauses if not CONTAINER_WORDS_RE.search(c)]
    return ' '.join(kept)


def strip_width_param(url):
    """Remove &width=N from image URLs."""
    if not url:
        return url
    return re.sub(r'&width=\d+', '', url)


def fix_title_case(name):
    """Fix incorrect capitalization after apostrophes (e.g. Grower'S → Grower's).

    Scraped data often applies title-casing which capitalizes letters after
    apostrophes. This lowercases single characters that follow an apostrophe
    within a word (possessives, contractions) while leaving the rest intact.
    """
    if not name:
        return name
    return re.sub(r"(?<=\w')([A-Z])(?=\s|$|\w)", lambda m: m.group(1).lower(), name)


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

        if not os.path.exists(file_path):
            self.stdout.write(
                self.style.ERROR(f'File not found: {file_path}')
            )
            return

        # Clear existing data if requested
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            Review.objects.all().delete()
            ProductCategory.objects.all().delete()
            ProductCollection.objects.all().delete()
            ProductOccasion.objects.all().delete()
            ProductStemType.objects.all().delete()
            ProductColor.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            Collection.objects.all().delete()
            Occasion.objects.all().delete()
            StemType.objects.all().delete()
            Color.objects.all().delete()

        # Seed stem-type and color tag rows from vocabularies
        stem_types_cache = {
            slug: StemType.objects.get_or_create(
                slug=slug, defaults={'name': entry['name']}
            )[0]
            for slug, entry in STEM_VOCAB.items()
        }
        colors_cache = {
            slug: Color.objects.get_or_create(
                slug=slug,
                defaults={'name': entry['name'], 'hex': entry['hex']},
            )[0]
            for slug, entry in COLOR_VOCAB.items()
        }

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
                    'nav_img_src': strip_width_param(cat.get('nav_img_src')),
                    'nav_description': cat.get('nav_description'),
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
                    'nav_img_src': strip_width_param(col.get('nav_img_src')),
                    'nav_description': col.get('nav_description'),
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
                    'nav_img_src': strip_width_param(occ.get('nav_img_src')),
                    'nav_description': occ.get('nav_description'),
                }
            )
            occasions_cache[occ['name']] = occasion
        self.stdout.write(f'  Seeded {len(occasions_cache)} occasions')

        # Create products
        created_products = {}
        for product_data in products_data:
            self.stdout.write(f'Processing: {product_data["name"]}')

            clean_name = fix_title_case(product_data['name'])
            clean_base_name = fix_title_case(product_data['base_name'])

            product, created = Product.objects.get_or_create(
                external_id=product_data['id'],
                defaults={
                    'name': clean_name,
                    'slug': slugify(clean_name),
                    'variant_type': product_data.get('variant_type'),
                    'base_name': clean_base_name,
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
                    'vase_included': bool(
                        CONTAINER_WORDS_RE.search(
                            (product_data.get('subtitle') or '')
                            + ' '
                            + (product_data.get('description') or '')
                        )
                    ),
                }
            )

            created_products[product_data['id']] = product

            if created:
                self.stdout.write(f'  Created: {product.name}')
            else:
                self.stdout.write(f'  Already exists: {product.name}')

            # Link categories
            for cat_entry in product_data.get('categories', []):
                cat_name = cat_entry['name'] if isinstance(cat_entry, dict) else cat_entry
                cat_index = cat_entry.get('index', 0) if isinstance(cat_entry, dict) else 0
                if cat_name in categories_cache:
                    ProductCategory.objects.update_or_create(
                        product=product,
                        category=categories_cache[cat_name],
                        defaults={'position': cat_index}
                    )

            # Link collections
            for col_entry in product_data.get('collections', []):
                col_name = col_entry['name'] if isinstance(col_entry, dict) else col_entry
                col_index = col_entry.get('index', 0) if isinstance(col_entry, dict) else 0
                if col_name in collections_cache:
                    ProductCollection.objects.update_or_create(
                        product=product,
                        collection=collections_cache[col_name],
                        defaults={'position': col_index}
                    )

            # Link occasions
            for occ_entry in product_data.get('occasions', []):
                occ_name = occ_entry['name'] if isinstance(occ_entry, dict) else occ_entry
                occ_index = occ_entry.get('index', 0) if isinstance(occ_entry, dict) else 0
                if occ_name in occasions_cache:
                    ProductOccasion.objects.update_or_create(
                        product=product,
                        occasion=occasions_cache[occ_name],
                        defaults={'position': occ_index}
                    )

            # Derive stem-type + color tags from product text
            text_blob = ' '.join(filter(None, [
                product_data.get('name'),
                product_data.get('subtitle'),
                product_data.get('description'),
            ]))

            for position, stem_slug in enumerate(match_vocab(text_blob, STEM_VOCAB)):
                ProductStemType.objects.update_or_create(
                    product=product,
                    stem_type=stem_types_cache[stem_slug],
                    defaults={'position': position},
                )

            # Color scan uses text with container-describing clauses removed.
            color_slugs = match_vocab(strip_container_clauses(text_blob), COLOR_VOCAB)
            if len(color_slugs) >= ASSORTED_COLOR_THRESHOLD:
                color_slugs.append('assorted')
            for position, color_slug in enumerate(color_slugs):
                ProductColor.objects.update_or_create(
                    product=product,
                    color=colors_cache[color_slug],
                    defaults={'position': position},
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

        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully seeded:\n'
                f'  Products: {Product.objects.count()}\n'
                f'  Categories: {Category.objects.count()}\n'
                f'  Collections: {Collection.objects.count()}\n'
                f'  Occasions: {Occasion.objects.count()}\n'
                f'  Stem Types: {StemType.objects.count()} ({ProductStemType.objects.count()} links)\n'
                f'  Colors: {Color.objects.count()} ({ProductColor.objects.count()} links)\n'
                f'  Reviews: {Review.objects.count()}'
            )
        )
