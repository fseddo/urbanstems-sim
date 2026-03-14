#!/usr/bin/env python3
"""
Transform products.json to use variants array instead of variant_type string.

This script:
1. Reads the existing products.json file
2. Groups products by base_name to identify variant relationships
3. Creates a variants array for each product containing {id, name, main_image}
4. Removes the old variant_type and *_variation fields
5. Outputs the transformed data to products_new.json
"""

import json
from pathlib import Path
from typing import Dict, List, Any

def load_products(file_path: Path) -> List[Dict[str, Any]]:
    """Load products from JSON file."""
    with open(file_path, 'r') as f:
        return json.load(f)

def save_products(file_path: Path, products: List[Dict[str, Any]]) -> None:
    """Save products to JSON file with pretty formatting."""
    with open(file_path, 'w') as f:
        json.dump(products, f, indent=2)
    print(f"Saved transformed data to {file_path}")

def build_variant_groups(products: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Group products by base_name to identify variants."""
    groups = {}
    for product in products:
        base_name = product.get('base_name', product['name'])
        if base_name not in groups:
            groups[base_name] = []
        groups[base_name].append(product)
    return groups

def create_variant_object(product: Dict[str, Any]) -> Dict[str, Any]:
    """Create a variant object with id, name, and main_image."""
    variant_type = product.get('variant_type', 'single')

    # Create a descriptive name based on variant type
    if variant_type == 'single':
        display_name = 'Single'
    elif variant_type == 'double':
        display_name = 'Double'
    elif variant_type == 'triple':
        display_name = 'Triple'
    else:
        display_name = 'Standard'

    return {
        'id': int(product['id']),
        'name': display_name,
        'main_image': product.get('main_image')
    }

def transform_products(products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Transform products to use variants array."""
    # Build a mapping of product ID to product
    product_map = {p['id']: p for p in products}

    # Build variant groups
    variant_groups = build_variant_groups(products)

    transformed = []

    for product in products:
        # Create a copy to avoid modifying original
        new_product = product.copy()

        # Build variants array
        variants = []
        base_name = product.get('base_name', product['name'])

        # Add all products with the same base_name as variants
        for variant_product in variant_groups.get(base_name, []):
            variants.append(create_variant_object(variant_product))

        # Sort variants by id to ensure consistent ordering (single, double, triple)
        variants.sort(key=lambda v: v['id'])

        # Add variants array
        new_product['variants'] = variants

        # Remove old fields
        fields_to_remove = [
            'variant_type',
            'double_variation',
            'triple_variation',
            'single_variation'
        ]

        for field in fields_to_remove:
            if field in new_product:
                del new_product[field]

        transformed.append(new_product)

    return transformed

def main():
    """Main transformation function."""
    script_dir = Path(__file__).parent
    input_file = script_dir / 'products.json'
    output_file = script_dir / 'products_new.json'

    print(f"Loading products from {input_file}")
    products = load_products(input_file)
    print(f"Loaded {len(products)} products")

    print("Transforming products...")
    transformed = transform_products(products)

    # Print sample transformation
    print("\nSample transformation (first product):")
    print(f"Before variants: {products[0].get('variant_type')}")
    print(f"After variants: {json.dumps(transformed[0]['variants'], indent=2)}")

    # Count products with multiple variants
    multi_variant_count = sum(1 for p in transformed if len(p['variants']) > 1)
    print(f"\nProducts with multiple variants: {multi_variant_count}")

    save_products(output_file, transformed)
    print(f"\nTransformation complete!")
    print(f"Review {output_file} and if satisfied, replace {input_file}")

if __name__ == '__main__':
    main()
