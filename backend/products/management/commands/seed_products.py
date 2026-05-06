import json
import os
import re
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from products.models import (
    Product, Review, Facet, Tag, ProductTag, FACET_DEFS,
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

        # Clear existing data if requested. Order matters for FK constraints:
        # Review → Product (FK to Product); ProductTag → Product+Tag;
        # Tag → Facet. Cascading on Product/Tag/Facet would also work but
        # explicit is clearer.
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            Review.objects.all().delete()
            ProductTag.objects.all().delete()
            Product.objects.all().delete()
            Tag.objects.all().delete()
            Facet.objects.all().delete()

        # Seed the 5 Facet rows from the model-level FACET_DEFS constant
        facets_by_slug = {
            slug: Facet.objects.get_or_create(
                slug=slug, defaults={'name': name, 'kind': kind}
            )[0]
            for slug, name, kind in FACET_DEFS
        }

        # Seed filter-kind tags (color, stem_type) from vocabularies
        stem_facet = facets_by_slug['stem_type']
        color_facet = facets_by_slug['color']

        stem_tags_cache = {
            slug: Tag.objects.get_or_create(
                facet=stem_facet,
                slug=slug,
                defaults={'name': entry['name']},
            )[0]
            for slug, entry in STEM_VOCAB.items()
        }
        color_tags_cache = {
            slug: Tag.objects.get_or_create(
                facet=color_facet,
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

        # Seed landing-kind tags (category, collection, occasion) from the
        # JSON's dedicated arrays. Each entry's `name` is the display name;
        # we slugify it for the URL slug. Landing-page metadata (image_src,
        # page_title, header_*, nav_*) flows from the JSON onto the Tag.
        def _seed_landing_tag(facet_slug, entry):
            facet = facets_by_slug[facet_slug]
            tag, _ = Tag.objects.get_or_create(
                facet=facet,
                slug=slugify(entry['name']),
                defaults={
                    'name': entry['name'],
                    'image_src': strip_width_param(entry.get('image_src')),
                    'page_title': entry.get('page_title'),
                    'header_title': entry.get('header_title'),
                    'header_subtitle': entry.get('header_subtitle'),
                    'nav_img_src': strip_width_param(entry.get('nav_img_src')),
                    'nav_description': entry.get('nav_description'),
                },
            )
            return tag

        # Cache landing-kind tags by (facet_slug, source_name) for fast
        # lookup when linking products. Source uses display name as the key
        # because product entries reference categories/collections/occasions
        # by name (not slug) in the JSON.
        landing_tags_by_name: dict[tuple[str, str], Tag] = {}
        for cat in categories_data:
            landing_tags_by_name[('category', cat['name'])] = _seed_landing_tag('category', cat)
        for col in collections_data:
            landing_tags_by_name[('collection', col['name'])] = _seed_landing_tag('collection', col)
        for occ in occasions_data:
            landing_tags_by_name[('occasion', occ['name'])] = _seed_landing_tag('occasion', occ)
        self.stdout.write(
            f'  Seeded landing tags: {len(categories_data)} category, '
            f'{len(collections_data)} collection, {len(occasions_data)} occasion'
        )

        # Create products
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

            if created:
                self.stdout.write(f'  Created: {product.name}')
            else:
                self.stdout.write(f'  Already exists: {product.name}')

            # Link landing-kind tags (categories / collections / occasions),
            # preserving the per-tag `position` from the JSON entry.
            def _link_landing(facet_slug, json_field):
                for entry in product_data.get(json_field, []):
                    tag_name = entry['name'] if isinstance(entry, dict) else entry
                    position = entry.get('index', 0) if isinstance(entry, dict) else 0
                    tag = landing_tags_by_name.get((facet_slug, tag_name))
                    if tag is None:
                        continue
                    ProductTag.objects.update_or_create(
                        product=product, tag=tag, defaults={'position': position}
                    )

            _link_landing('category', 'categories')
            _link_landing('collection', 'collections')
            _link_landing('occasion', 'occasions')

            # Derive stem-type + color tags from product text
            text_blob = ' '.join(filter(None, [
                product_data.get('name'),
                product_data.get('subtitle'),
                product_data.get('description'),
            ]))

            for position, stem_slug in enumerate(match_vocab(text_blob, STEM_VOCAB)):
                ProductTag.objects.update_or_create(
                    product=product,
                    tag=stem_tags_cache[stem_slug],
                    defaults={'position': position},
                )

            # Color scan uses text with container-describing clauses removed.
            color_slugs = match_vocab(strip_container_clauses(text_blob), COLOR_VOCAB)
            if len(color_slugs) >= ASSORTED_COLOR_THRESHOLD:
                color_slugs.append('assorted')
            for position, color_slug in enumerate(color_slugs):
                ProductTag.objects.update_or_create(
                    product=product,
                    tag=color_tags_cache[color_slug],
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
                f'  Facets: {Facet.objects.count()}\n'
                f'  Tags: {Tag.objects.count()} '
                f'({ProductTag.objects.count()} product-tag links)\n'
                f'  Reviews: {Review.objects.count()}'
            )
        )
