import base64
import requests
from io import BytesIO
from PIL import Image, ImageFilter
from django.core.management.base import BaseCommand
from products.models import Product


class Command(BaseCommand):
    help = 'Generate blur data URLs for product images'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Regenerate blur URLs even if they already exist',
        )
        parser.add_argument(
            '--size',
            type=int,
            default=10,
            help='Width of the blur placeholder in pixels (default: 10)',
        )

    def handle(self, *args, **options):
        force = options['force']
        size = options['size']

        if force:
            products = Product.objects.filter(main_image__isnull=False)
        else:
            products = Product.objects.filter(
                main_image__isnull=False,
                blur_data_url__isnull=True
            )

        total = products.count()
        self.stdout.write(f'Processing {total} products...')

        success_count = 0
        error_count = 0

        for i, product in enumerate(products, 1):
            try:
                blur_url = self.generate_blur_data_url(product.main_image, size)
                if blur_url:
                    product.blur_data_url = blur_url
                    product.save(update_fields=['blur_data_url'])
                    success_count += 1
                else:
                    error_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error processing {product.name}: {e}')
                )
                error_count += 1

            if i % 10 == 0:
                self.stdout.write(f'Progress: {i}/{total}')

        self.stdout.write(
            self.style.SUCCESS(
                f'Done! Generated {success_count} blur placeholders, {error_count} errors'
            )
        )

    def generate_blur_data_url(self, image_url, size):
        """Download image, create blur placeholder, return as data URL"""
        try:
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()

            img = Image.open(BytesIO(response.content))

            # Convert to RGB if necessary (handles RGBA, P mode, etc.)
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')

            # Calculate height to maintain aspect ratio
            aspect_ratio = img.height / img.width
            new_height = int(size * aspect_ratio)

            # Resize to tiny size
            img = img.resize((size, new_height), Image.Resampling.LANCZOS)

            # Apply slight blur for smoother appearance
            img = img.filter(ImageFilter.GaussianBlur(radius=1))

            # Convert to base64
            buffer = BytesIO()
            img.save(buffer, format='JPEG', quality=40)
            base64_str = base64.b64encode(buffer.getvalue()).decode('utf-8')

            return f'data:image/jpeg;base64,{base64_str}'

        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Failed to process {image_url}: {e}'))
            return None
