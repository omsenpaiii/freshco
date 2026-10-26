"""Print one idempotent SQL batch for importing catalog-manifest.json to Neon."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = json.loads((ROOT / "src/data/catalog-manifest.json").read_text())


def json_literal(value: object) -> str:
    encoded = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    return "'" + encoded.replace("'", "''") + "'::jsonb"


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit("usage: build-neon-catalog-batch.py categories|products|variants|product-variants OFFSET LIMIT")
    kind, offset_arg, limit_arg = sys.argv[1:]
    offset, limit = int(offset_arg), int(limit_arg)

    if kind == "categories":
        rows = MANIFEST["categories"][offset : offset + limit]
        data = json_literal(rows)
        print(f"""
INSERT INTO categories (id,name,slug,description,image_url,image_source_url,image_license,products_count)
SELECT id,name,slug,description,image_url,image_source_url,image_license,products_count
FROM jsonb_to_recordset({data}) AS x(
  id bigint,name text,slug text,description text,image_url text,
  image_source_url text,image_license text,products_count integer
)
ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name,slug=EXCLUDED.slug,description=EXCLUDED.description,
  image_url=EXCLUDED.image_url,image_source_url=EXCLUDED.image_source_url,
  image_license=EXCLUDED.image_license,products_count=EXCLUDED.products_count
""")
        return

    if kind == "products":
        product_columns = (
            "id", "name", "slug", "description", "price", "compare_at_price", "sku",
            "inventory_quantity", "is_featured", "is_trending", "images", "category_id",
            "brand", "unit", "subcategory_1", "subcategory_2", "status", "image_match_status",
            "product_source_url", "image_source_url", "image_license", "storage_object_key",
            "draft_reason", "source_active", "source_workbook", "source_row", "source_item_name",
        )
        rows = [
            {column: product[column] for column in product_columns}
            for product in MANIFEST["products"][offset : offset + limit]
        ]
        data = json_literal(rows)
        print(f"""
INSERT INTO products (
  id,name,slug,description,price,compare_at_price,sku,inventory_quantity,
  is_featured,is_trending,images,category_id,brand,unit,subcategory_1,subcategory_2,
  status,image_match_status,product_source_url,image_source_url,image_license,
  storage_object_key,draft_reason,source_active,source_workbook,source_row,source_item_name
)
SELECT id,name,slug,description,price,compare_at_price,sku,inventory_quantity,
  is_featured,is_trending,images,category_id,brand,unit,subcategory_1,subcategory_2,
  status,image_match_status,product_source_url,image_source_url,image_license,
  storage_object_key,draft_reason,source_active,source_workbook,source_row,source_item_name
FROM jsonb_to_recordset({data}) AS x(
  id bigint,name text,slug text,description text,price numeric,compare_at_price numeric,
  sku text,inventory_quantity integer,is_featured boolean,is_trending boolean,
  images text[],category_id bigint,brand text,unit text,subcategory_1 text,subcategory_2 text,
  status text,image_match_status text,product_source_url text,image_source_url text,
  image_license text,storage_object_key text,draft_reason text,source_active boolean,
  source_workbook text,source_row integer,source_item_name text
)
ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name,slug=EXCLUDED.slug,description=EXCLUDED.description,price=EXCLUDED.price,
  compare_at_price=EXCLUDED.compare_at_price,sku=EXCLUDED.sku,
  inventory_quantity=EXCLUDED.inventory_quantity,is_featured=EXCLUDED.is_featured,
  is_trending=EXCLUDED.is_trending,images=EXCLUDED.images,category_id=EXCLUDED.category_id,
  brand=EXCLUDED.brand,unit=EXCLUDED.unit,subcategory_1=EXCLUDED.subcategory_1,
  subcategory_2=EXCLUDED.subcategory_2,status=EXCLUDED.status,
  image_match_status=EXCLUDED.image_match_status,product_source_url=EXCLUDED.product_source_url,
  image_source_url=EXCLUDED.image_source_url,image_license=EXCLUDED.image_license,
  storage_object_key=EXCLUDED.storage_object_key,draft_reason=EXCLUDED.draft_reason,
  source_active=EXCLUDED.source_active,source_workbook=EXCLUDED.source_workbook,
  source_row=EXCLUDED.source_row,source_item_name=EXCLUDED.source_item_name
""")
        return

    if kind == "variants":
        rows = [variant for product in MANIFEST["products"] for variant in product["variants"]]
        rows = rows[offset : offset + limit]
    elif kind == "product-variants":
        rows = [variant for product in MANIFEST["products"][offset : offset + limit] for variant in product["variants"]]
    else:
        rows = None
    if kind in {"variants", "product-variants"}:
        variant_columns = (
            "product_id", "title", "sku", "weight_grams", "price", "inventory_quantity",
            "is_default", "image_url", "image_source_url", "image_license",
        )
        rows = [{column: variant[column] for column in variant_columns} for variant in rows]
        data = json_literal(rows)
        print(f"""
INSERT INTO product_variants (
  product_id,title,sku,weight_grams,price,inventory_quantity,is_default,
  image_url,image_source_url,image_license
)
SELECT product_id,title,sku,weight_grams,price,inventory_quantity,is_default,
  image_url,image_source_url,image_license
FROM jsonb_to_recordset({data}) AS x(
  product_id bigint,title text,sku text,weight_grams integer,price numeric,
  inventory_quantity integer,is_default boolean,image_url text,image_source_url text,image_license text
)
ON CONFLICT (product_id,title) DO UPDATE SET
  sku=EXCLUDED.sku,weight_grams=EXCLUDED.weight_grams,price=EXCLUDED.price,
  inventory_quantity=EXCLUDED.inventory_quantity,is_default=EXCLUDED.is_default,
  image_url=EXCLUDED.image_url,image_source_url=EXCLUDED.image_source_url,
  image_license=EXCLUDED.image_license,updated_at=now()
""")
        return

    raise SystemExit(f"unknown batch kind: {kind}")


if __name__ == "__main__":
    main()
