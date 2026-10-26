"""Build FreshCo's auditable catalog manifest from the current client workbook.

Run with the workspace Python runtime and openpyxl installed. This intentionally
does not manufacture image matches: only products listed in the explicit
verification map or the previously audited exact-pack manifest can be published.
"""

from __future__ import annotations

import json
import os
import re
from collections import Counter
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

import openpyxl


ROOT = Path(__file__).resolve().parents[1]
WORKBOOK = Path("/Users/omtomar/Downloads/ITEMS (3).xlsx")
NEON_STORAGE_PUBLIC_BASE = os.getenv("NEON_STORAGE_PUBLIC_BASE", "").rstrip("/")
MANIFEST_PATH = ROOT / "src/data/catalog-manifest.json"
PRODUCTS_PATH = ROOT / "src/data/products.json"
CATEGORIES_PATH = ROOT / "src/data/categories.json"
LEGACY_PATH = ROOT / "src/data/catalog-manifest.previous.json"

CATEGORY_IDS = {
    "Cheese": 1,
    "Frozen": 2,
    "Grocery": 3,
    "Deli": 4,
    "Small Goods": 5,
    "Religious": 6,
    "Feta": 7,
    "Festive": 8,
    "Olives": 9,
}

# These legacy IDs map the already researched Dodoni / Filosophy / Misko set to
# their corresponding rows in the newest workbook. A candidate is only reused
# if the former manifest marked that exact product/package image verified.
LEGACY_ID_BY_ROW = {
    2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8, 10: 9, 11: 10,
    12: 11, 13: 12, 14: 13, 15: 14, 16: 15, 17: 16, 18: 17, 19: 18,
    20: 19, 21: 20, 22: 21, 23: 22, 24: 23, 25: 24, 26: 25,
    27: 26, 28: 27, 29: 28, 30: 29, 31: 30, 32: 31, 33: 32,
    34: 33, 35: 34, 36: 35, 37: 36, 38: 37, 39: 38,
}

LEGACY_IMAGE_REJECTIONS = {
    11: "Visual pack-size check failed: the Dodoni barrel-aged feta image says 330 g, while the workbook item is 150 g.",
    12: "The official image is an unwrapped pie, not the exact packaged 850 g SKU.",
    13: "The official image is an unwrapped pie, not the exact packaged 850 g SKU.",
    14: "The official image is an unwrapped pie, not the exact packaged 850 g SKU.",
    15: "The official image is an unwrapped pie, not the exact packaged 850 g SKU.",
}

MANUAL_IMAGE_MATCHES = {
    4: {
        "product_source_url": "https://www.harrisfarm.com.au/products/dodoni-feta",
        "image_source_url": "https://www.harrisfarm.com.au/cdn/shop/products/82649_HFARM_5201168215649-2.jpeg?v=1441101943&width=1445",
        "verification_note": "Visually checked: Dodoni Feta tub with 400 g printed on pack.",
        "image_license": "Retailer product image; source recorded; commercial reuse permission not independently confirmed.",
    },
    5: {
        "product_source_url": "https://www.basher.co.il/product/%D7%A4%D7%98%D7%94-%D7%A2%D7%99%D7%96%D7%99%D7%9D-400-%D7%92%D7%A8%D7%9D/",
        "image_source_url": "https://www.basher.co.il/wp-content/uploads/%D7%A4%D7%98%D7%94-%D7%A2%D7%99%D7%96%D7%99%D7%9D-%D7%93%D7%95%D7%93%D7%95%D7%A0%D7%99-400-%D7%92%D7%A8%D7%9D-%D7%93%D7%92%D7%95%D7%9C-2-990x743.jpg",
        "verification_note": "Visually checked: Dodoni Goat's Cheese/Katsiki tub with 400 g printed on pack.",
        "image_license": "Retailer product image; source recorded; commercial reuse permission not independently confirmed.",
    },
    40: {
        "product_source_url": "https://www.tw.coupang.com/products/21007563236135",
        "image_source_url": "https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/retail/images/86492059809431-53af6ef0-b9d5-4a0f-b7a8-a77c25f9ba8b.jpg",
        "verification_note": "Visually checked: Attiki Greek honey jar and carton marked 500 g.",
        "image_license": "Retailer product image; source recorded; commercial reuse permission not independently confirmed.",
    },
    41: {
        "product_source_url": "https://www.aegeanexports.gr/products/attiki-100-greek-honey-from-thyme-in-jar/",
        "image_source_url": "https://www.aegeanexports.gr/wp-content/uploads/16391.jpg",
        "verification_note": "Visually checked: Attiki honey jar marked 250 g.",
        "image_license": "Distributor product image; source recorded; commercial reuse permission not independently confirmed.",
    },
    54: {
        "product_source_url": "https://www.sklavenitis.gr/eidi-artozacharoplasteioy/kritsinia-paximadia-fryganies/paximadia/tsatsaronakis-to-manna-dagoto-paximadi-me-domata-piperia-kremmudi-110gr/",
        "image_source_url": "https://s1.sklavenitis.gr/images/1600x1600/files/ProductMedia/Products/1583667/1.jpg",
        "verification_note": "Visually checked: The Manna crispy bites, tomato/pepper/onion flavor, 110 g front pack.",
        "image_license": "Retailer product image; source recorded; commercial reuse permission not independently confirmed.",
    },
    55: {
        "product_source_url": "https://www.sklavenitis.gr/eidi-artozacharoplasteioy/kritsinia-paximadia-fryganies/paximadia/tsatsaronakis-to-manna-dagkoto-paximadi-me-mauri-troufa-110gr-1583666/",
        "image_source_url": "https://s1.sklavenitis.gr/images/1600x1600/files/ProductMedia/Products/1583666/1.jpg",
        "verification_note": "Visually checked: The Manna crispy bites with black truffle, 110 g front pack.",
        "image_license": "Retailer product image; source recorded; commercial reuse permission not independently confirmed.",
    },
    56: {
        "product_source_url": "https://www.sklavenitis.gr/eidi-artozacharoplasteioy/kritsinia-paximadia-fryganies/paximadia/tsatsaronakis-to-manna-dagkoto-paximadi-me-graviera-glukia-paprika-110gr/",
        "image_source_url": "https://s1.sklavenitis.gr/images/1600x1600/files/ProductMedia/Products/1583658/1.jpg",
        "verification_note": "Visually checked: The Manna crispy bites with graviera and sweet paprika, 110 g front pack.",
        "image_license": "Retailer product image; source recorded; commercial reuse permission not independently confirmed.",
    },
    57: {
        "product_source_url": "https://www.sklavenitis.gr/eidi-artozacharoplasteioy/kritsinia-paximadia-fryganies/paximadia/tsatsaronakis-to-manna-dagkoto-paximadi-me-elia-liasti-ntomata-110gr-1583664/",
        "image_source_url": "https://s1.sklavenitis.gr/images/1600x1600/files/ProductMedia/Products/1583664/1.jpg",
        "verification_note": "Visually checked: The Manna crispy bites with olive and sun-dried tomato, 110 g front pack.",
        "image_license": "Retailer product image; source recorded; commercial reuse permission not independently confirmed.",
    },
    58: {
        "product_source_url": "https://www.thanopoulos.gr/en/products/artoskeuasmata-almura-gluka/kritsinia-paximadia/artopoieia-tsatsarwnakh-to-manna-paximadia-kritharenia-300g-669798476b86ff00024cacca/",
        "image_source_url": "https://wave-grocery.s3.eu-central-1.amazonaws.com/thanopoulos/products/5201882006721_4_1_1EB109DABB130B5DB879F84EC4806D22.jpg",
        "verification_note": "Visually checked: The Manna barley rusks package marked 300 g; product and pack size match.",
        "image_license": "Retailer product image; source recorded; commercial reuse permission not independently confirmed.",
    },
    59: {
        "product_source_url": "https://www.e-fresh.gr/en/paximadi-kritharenio-xwris-alati-to-manna-300g",
        "image_source_url": "https://dj0m4io8o9yuz.cloudfront.net/storage/media/catalog/products/410/1/4100148011/kritharenio-xwris-alati-300gr-002.jpg?id=1716470709",
        "verification_note": "Visually checked: The Manna barley rusks with no added salt, package marked 300 g.",
        "image_license": "Retailer product image; source recorded; commercial reuse permission not independently confirmed.",
    },
    60: {
        "product_source_url": "https://www.thanopoulos.gr/products/artoskeuasmata-almura-gluka/kritsinia-paximadia/artopoieia-tsatsarwnakh-manna-paximadia-sikalews-olikhs-alesews-280g-674d7a0706fde10002372bbf/",
        "image_source_url": "https://wave-grocery.s3.eu-central-1.amazonaws.com/thanopoulos/products/5201882006899_2_1_0C0F0B286DB7DE534445A0688A9AB970.jpg",
        "verification_note": "Visually checked: The Manna wholegrain rye rusks package marked 280 g.",
        "image_license": "Retailer product image; source recorded; commercial reuse permission not independently confirmed.",
    },
    61: {
        "product_source_url": "https://www.cretanoil.de/Traditionelle-Brotstangen-mit-Sesam-130g-Papadopoulos",
        "image_source_url": "https://www.cretanoil.de/media/image/product/89133/lg/traditionelle-brotstangen-mit-sesam-130g-papadopoulos.png",
        "verification_note": "Visually checked: Papadopoulos sesame kritsinia package, listed as 130 g.",
        "image_license": "Retailer product image; source recorded; commercial reuse permission not independently confirmed.",
    },
    3: {
        "product_source_url": "https://authenticflavourco.com.au/products/dodoni-feta-1kg",
        "image_source_url": "https://cdn.shopify.com/s/files/1/0619/8876/5854/products/DodoniFeta1kg2.webp?v=1658211619",
        "verification_note": "Rejected for publishing after visual check: package states 1.5 kg net / 1.1 kg drained, not the workbook's 1 kg sell unit.",
        "image_license": "Retailer product image candidate; rejected for size mismatch.",
        "verified": False,
    },
}


def clean(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def slugify(value: str) -> str:
    value = value.lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def normalize_name(value: str) -> str:
    # Only obvious catalogue typos; the original source string is kept in the
    # manifest for audit and the brand field itself remains workbook-faithful.
    replacements = {
        r"\bFetta\b": "Feta",
        r"\bChocoloate\b": "Chocolate",
        r"\bSphagetti\b": "Spaghetti",
        r"\bAustralan\b": "Australian",
        r"\bMarniated\b": "Marinated",
        r"\bAvacado\b": "Avocado",
        r"\bPortugese\b": "Portuguese",
        r"\bTapanede\b": "Tapenade",
        r"\bHommus\b": "Hummus",
    }
    result = clean(value)
    for pattern, replacement in replacements.items():
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
    return result


def active_fill(cell) -> bool:
    fill = cell.fill
    color = fill.fgColor
    if fill.patternType != "solid":
        return False
    if color.type == "theme":
        return color.theme == 6 and color.tint > 0.7
    if color.type == "rgb":
        return str(color.rgb).upper() in {"FF00B050", "FF92D050", "FF00FF00"}
    return False


def pack_from_name(name: str) -> str:
    matches = list(re.finditer(r"(?<!\w)(\d+(?:\.\d+)?)\s*(kg|g|gm|gr|ml|lt|l)\b", name, re.I))
    if not matches:
        return "Each"
    match = matches[-1]
    unit = match.group(2).lower()
    amount = match.group(1)
    if unit == "kg":
        return f"{amount} kg"
    if unit in {"ml", "lt", "l"}:
        return f"{amount} ml" if unit == "ml" else f"{amount} L"
    return f"{amount} g"


def weight_grams(label: str) -> int | None:
    match = re.search(r"(\d+(?:\.\d+)?)\s*(kg|g|gm|gr)\b", label, re.I)
    if not match:
        return None
    amount = Decimal(match.group(1))
    return int((amount * (1000 if match.group(2).lower() == "kg" else 1)).quantize(Decimal("1")))


def cents(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def parse_price(value: object) -> Decimal | None:
    if value is None or clean(value) == "":
        return None
    try:
        return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except Exception:
        return None


def read_legacy() -> dict[int, dict]:
    if not LEGACY_PATH.exists():
        return {}
    legacy = json.loads(LEGACY_PATH.read_text())
    return {int(product["id"]): product for product in legacy.get("products", [])}


def main() -> None:
    if not WORKBOOK.exists():
        raise SystemExit(f"Workbook not found: {WORKBOOK}")

    # Preserve the prior generated manifest as a traceable source for the
    # previously reviewed images. The build output replaces the working copy.
    if MANIFEST_PATH.exists() and not LEGACY_PATH.exists():
        LEGACY_PATH.write_text(MANIFEST_PATH.read_text())
    legacy = read_legacy()

    workbook = openpyxl.load_workbook(WORKBOOK, data_only=True)
    sheet = workbook.active
    headers = [clean(sheet.cell(1, col).value) for col in range(1, 9)]
    expected = ["ITEM NAME", "price", "unit", "Variant", "Brand", "Category", "Sub Category1", "Sub Category2"]
    if headers != expected:
        raise SystemExit(f"Unexpected workbook headers: {headers!r}")

    categories_by_name = {}
    for name, category_id in CATEGORY_IDS.items():
        categories_by_name[name] = {
            "id": category_id,
            "name": name,
            "slug": slugify(name),
            "description": {
                "Cheese": "Cheese and feta from the FreshCo catalogue.",
                "Frozen": "Frozen pies and prepared favourites.",
                "Grocery": "Pantry staples and everyday grocery items.",
                "Deli": "Deli-counter favourites and prepared foods.",
                "Small Goods": "Small goods and deli meats.",
                "Religious": "Religious and ceremonial goods.",
                "Feta": "Feta products listed in the FreshCo catalogue.",
                "Festive": "Festive and seasonal products.",
                "Olives": "Olives and olive varieties.",
            }[name],
            "image_url": None,
            "image_source_url": None,
            "image_license": None,
        }

    raw_rows = []
    for row_number in range(2, sheet.max_row + 1):
        values = [sheet.cell(row_number, col).value for col in range(1, 9)]
        if not any(value is not None and clean(value) for value in values):
            continue
        raw_rows.append({
            "source_row": row_number,
            "source_active": active_fill(sheet.cell(row_number, 1)),
            "source_values": values,
            "source_item_name": clean(values[0]),
        })

    # Collapse only fully identical duplicate rows. If two same-name rows differ
    # by pack, unit, price, brand, or category they remain distinct products.
    deduped: dict[tuple, dict] = {}
    duplicate_sources: list[dict] = []
    for source in raw_rows:
        values = source["source_values"]
        normalized = normalize_name(clean(values[0]))
        key = (
            normalized.casefold(), clean(values[2]).casefold(), clean(values[3]).casefold(),
            clean(values[4]).casefold(), clean(values[5]).casefold(),
            clean(values[6]).casefold(), clean(values[7]).casefold(), str(parse_price(values[1])),
        )
        if key in deduped:
            existing = deduped[key]
            existing["source_active"] = existing["source_active"] or source["source_active"]
            existing["source_rows"].append(source["source_row"])
            duplicate_sources.append({"kept_row": existing["source_row"], "duplicate_row": source["source_row"], "name": normalized})
        else:
            source["source_rows"] = [source["source_row"]]
            deduped[key] = source

    products = []
    slug_counts = Counter()
    active_rows = 0
    missing_price_count = 0
    missing_unit_count = 0
    for source in deduped.values():
        row_number = source["source_row"]
        (raw_name, raw_price, raw_unit, raw_variants, raw_brand, raw_category, raw_sub1, raw_sub2) = source["source_values"]
        name = normalize_name(clean(raw_name))
        category = clean(raw_category)
        if category not in categories_by_name:
            raise SystemExit(f"Row {row_number}: unknown category {category!r}")
        price = parse_price(raw_price)
        unit = clean(raw_unit).upper()
        brand = clean(raw_brand)
        subcategory_1 = clean(raw_sub1)
        subcategory_2 = clean(raw_sub2)
        pack = pack_from_name(name)
        source_active = bool(source["source_active"])
        active_rows += int(source_active)
        missing_price = price is None
        missing_unit = not unit
        missing_price_count += int(source_active and missing_price)
        missing_unit_count += int(source_active and missing_unit)

        options = [clean(part) for part in clean(raw_variants).split("/") if clean(part)] if raw_variants else []
        size_options = options and all(weight_grams(option) is not None for option in options)
        variant_specs = []
        if size_options:
            for option in options:
                grams = weight_grams(option)
                variant_price = cents((price or Decimal("0")) * Decimal(grams or 0) / Decimal(1000)) if unit == "KG" else (price or Decimal("0"))
                variant_specs.append({"label": option, "weight_grams": grams, "price": variant_price})
        elif options:
            for option in options:
                variant_specs.append({"label": f"{option} · {pack}", "weight_grams": weight_grams(pack), "price": price or Decimal("0")})
        else:
            variant_specs.append({"label": pack, "weight_grams": weight_grams(pack), "price": price or Decimal("0")})

        slug_base = slugify(f"{name}-{pack}")
        slug_counts[slug_base] += 1
        slug = slug_base if slug_counts[slug_base] == 1 else f"{slug_base}-{row_number}"
        # Keep the IDs of the previously seeded first rows where available so
        # existing product references don't get orphaned during the rollover.
        product_id = LEGACY_ID_BY_ROW.get(row_number, 10000 + row_number)
        legacy_product = legacy.get(LEGACY_ID_BY_ROW.get(row_number, -1))
        image_match_status = "unverified"
        product_source_url = None
        image_source_url = None
        image_license = None
        verification_note = None
        if row_number in MANUAL_IMAGE_MATCHES:
            match = MANUAL_IMAGE_MATCHES[row_number]
            product_source_url = match["product_source_url"]
            image_source_url = match["image_source_url"]
            image_license = match["image_license"]
            verification_note = match["verification_note"]
            image_match_status = "verified" if match.get("verified", True) else "unverified"
        elif legacy_product and legacy_product.get("status") == "published" and legacy_product.get("image_match_status") == "verified":
            # The 250 g Kefalograviera photo doesn't establish a match for all
            # four pack-size options, so keep that multi-pack product pending.
            if row_number != 2:
                product_source_url = legacy_product.get("product_source_url")
                image_source_url = legacy_product.get("image_source_url") or ((legacy_product.get("images") or [None])[0])
                image_license = "Manufacturer/distributor/retailer product image; source retained in the legacy audit; confirm commercial rights before use."
                verification_note = LEGACY_IMAGE_REJECTIONS.get(row_number) or "Reused from the previously audited exact-match catalogue row; rechecked the new workbook product and pack image."
                image_match_status = "unverified" if row_number in LEGACY_IMAGE_REJECTIONS else "verified"

        reasons = []
        if not source_active:
            reasons.append("Dormant: workbook row is not highlighted green.")
        if missing_price:
            reasons.append("Workbook price is missing; do not sell until confirmed.")
        if missing_unit:
            reasons.append("Workbook unit is missing; do not sell until confirmed.")
        if image_match_status != "verified":
            reasons.append(verification_note or "No exact product-and-pack image has been visually verified yet.")
        publishable = source_active and price is not None and bool(unit) and image_match_status == "verified" and bool(image_source_url)

        image_extension = ".png" if row_number in {8, 16, 61} else ".jpg"
        storage_object_key = f"products/{slug}/primary{image_extension}" if image_source_url and image_match_status == "verified" else None
        public_image_url = f"{NEON_STORAGE_PUBLIC_BASE}/store-images/{storage_object_key}" if NEON_STORAGE_PUBLIC_BASE and storage_object_key else image_source_url

        variants = []
        brand_token = slugify(brand)[:8].upper() or "NO-BRAND"
        for index, variant in enumerate(variant_specs):
            title = variant["label"]
            sku = f"FC-{brand_token}-{slugify(name)[:28].upper()}-{slugify(title)[:18].upper()}-R{row_number}"
            variants.append({
                "id": product_id * 100 + index + 1,
                "product_id": product_id,
                "title": title,
                "sku": sku,
                "weight_grams": variant["weight_grams"],
                "price": float(variant["price"]),
                "inventory_quantity": 100 if source_active and price is not None and unit else 0,
                "is_default": len(variant_specs) == 1 or index == len(variant_specs) - 1,
                "image_url": public_image_url if len(variant_specs) == 1 and image_match_status == "verified" else None,
                "image_source_url": image_source_url if len(variant_specs) == 1 and image_match_status == "verified" else None,
                "image_license": image_license if len(variant_specs) == 1 and image_match_status == "verified" else None,
            })

        sale_unit = unit if unit else ""
        desc = f"{brand + ' ' if brand else ''}{name}. Sold as listed in the client catalogue ({sale_unit or 'unit not specified'}; pack {pack})."
        product = {
            "id": product_id,
            "name": name,
            "slug": slug,
            "description": desc,
            "price": float(variants[-1]["price"]),
            "compare_at_price": None,
            "sku": variants[-1]["sku"],
            "inventory_quantity": sum(variant["inventory_quantity"] for variant in variants),
            "images": [public_image_url] if public_image_url else [],
            "storage_object_key": storage_object_key,
            "category_id": CATEGORY_IDS[category],
            "brand": brand,
            "unit": sale_unit,
            "subcategory_1": subcategory_1,
            "subcategory_2": subcategory_2,
            "status": "published" if publishable else "draft",
            "image_match_status": image_match_status,
            "product_source_url": product_source_url,
            "image_source_url": image_source_url,
            "image_license": image_license,
            "draft_reason": " ".join(reasons) if reasons else None,
            "is_featured": False,
            "is_trending": False,
            "source_active": source_active,
            "source_workbook": WORKBOOK.name,
            "source_row": row_number,
            "source_rows": source["source_rows"],
            "source_item_name": clean(raw_name),
            "workbook_unit": clean(raw_unit),
            "workbook_price": None if price is None else float(price),
            "workbook_variant": clean(raw_variants),
            "variants": variants,
            "categories": {"name": category, "slug": slugify(category)},
        }
        products.append(product)

    if len(products) != 572:
        raise SystemExit(f"Expected 572 unique product rows after duplicate collapse, got {len(products)}")
    slugs = [product["slug"] for product in products]
    skus = [variant["sku"] for product in products for variant in product["variants"]]
    if len(set(slugs)) != len(slugs):
        raise SystemExit("Product slugs are not unique")
    if len(set(skus)) != len(skus):
        raise SystemExit("Variant SKUs are not unique")

    variants = [variant for product in products for variant in product["variants"]]
    source_active_products = [product for product in products if product["source_active"]]
    published = [product for product in products if product["status"] == "published"]
    existing_categories = {}
    if LEGACY_PATH.exists():
        legacy_json = json.loads(LEGACY_PATH.read_text())
        existing_categories = {category["name"]: category for category in legacy_json.get("categories", [])}
    categories = []
    for name, category in categories_by_name.items():
        old = existing_categories.get(name, {})
        categories.append({**category, "image_url": old.get("image_url"), "image_source_url": old.get("image_source_url"), "image_license": old.get("image_license"), "products_count": sum(1 for product in published if product["category_id"] == category["id"])})

    manifest = {
        "version": 3,
        "generated_at": "2026-10-25T00:00:00Z",
        "source_workbook": WORKBOOK.name,
        "source_path": str(WORKBOOK),
        "summary": {
            "source_rows": len(raw_rows),
            "unique_products": len(products),
            "duplicate_rows_removed": duplicate_sources,
            "green_source_rows": 481,
            "green_unique_products": len(source_active_products),
            "green_missing_price": missing_price_count,
            "green_missing_unit": missing_unit_count,
            "variants": len(variants),
            "published_exact_image_products": len(published),
            "draft_products": len(products) - len(published),
        },
        "categories": categories,
        "products": products,
    }

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    PRODUCTS_PATH.write_text(json.dumps(published, ensure_ascii=False, indent=2) + "\n")
    CATEGORIES_PATH.write_text(json.dumps(categories, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({
        "rows": len(raw_rows),
        "products": len(products),
        "variants": len(variants),
        "active_products": len(source_active_products),
        "active_missing_price": missing_price_count,
        "active_missing_unit": missing_unit_count,
        "published_exact_image_products": len(published),
        "duplicates": duplicate_sources,
        "categories": dict(Counter(product["categories"]["name"] for product in products)),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
