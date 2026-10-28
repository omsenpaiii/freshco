"""Build FreshCo's auditable catalog manifest from the current client workbook.

Run with the workspace Python runtime and openpyxl installed. This intentionally
does not manufacture image matches: only products listed in the explicit,
visually reviewed image map or the previously audited manifest can be published.
Product relevance is required; an exact pack size is not.
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

LEGACY_IMAGE_NOTES = {
    11: "Reviewed in the inherited audit: Dodoni barrel-aged feta package is a relevant product-family image, but it shows 330 g rather than the workbook's 150 g.",
    12: "Reviewed in the inherited audit: official Ioniki Feta filo spiral shown unwrapped; flavor/style match, but it is a serving photo rather than the exact 850 g package.",
    13: "Reviewed in the inherited audit: official Ioniki Feta-and-spinach filo spiral shown unwrapped; flavor/style match, but it is a serving photo rather than the exact 850 g package.",
    14: "Reviewed in the inherited audit: official Ioniki spinach filo spiral shown unwrapped; product style matches, but the photo is not the exact 850 g package.",
    15: "Reviewed in the inherited audit: official Ioniki wild-greens family pie shown unwrapped; filling/style is relevant, but the photo is not the exact 850 g package.",
}

MANUAL_IMAGE_MATCHES = {
    2: {
        "product_source_url": "https://nutritionempire.net/en/product/veg541dodoni-kefalograviera-250g",
        "image_source_url": "http://nutritionempire.net/loadimage/E2EB9761-0A69-4304-A0E5-BDA280F13767",
        "verification_note": "Visually reviewed from Google Images: Dodoni Kefalograviera product pack. Source shows a 250 g pack used as the reference image for the workbook's 250 g, 500 g, 700 g and 1 kg options.",
        "image_license": "Retailer product image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
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
    7: {
        "product_source_url": "https://www.biolaboratorium.com/en/products/halloumi-dodoni-kase-zum-braten-und-grillen-bio-200-g-oma",
        "image_source_url": "http://www.biolaboratorium.com/cdn/shop/files/109890.jpg?v=1747872216",
        "verification_note": "Visually reviewed from Google Images: Dodoni organic Halloumi front pack, marked 200 g; product and workbook size match.",
        "image_license": "Retailer product image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    9: {
        "product_source_url": "https://lab101.food/products/dodoni-feta-pdo-150g",
        "image_source_url": "https://lab101.food/cdn/shop/files/Dodoni_Feta_PDO_150_g_e2a64b6f-6f0d-404a-adaa-04930da2278b.jpg?v=1770158348&width=480",
        "verification_note": "Visually reviewed from Google Images: Dodoni Feta PDO 150 g front pack; product and workbook size match.",
        "image_license": "Retailer product image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    10: {
        "product_source_url": "https://www.luckystore.in/products/dodoni-goat-cheese-200g",
        "image_source_url": "http://www.luckystore.in/cdn/shop/files/Dodoni-Goat-Cheese_-200g-Authentic-Greek-Goat-Cheese-for-Salad-and-Mediterranean-Diet-Luckystore-60045656.png?v=1752235152",
        "verification_note": "Visually reviewed from Google Images: Dodoni Goat Cheese 200 g front pack; goat cheese product and workbook size match.",
        "image_license": "Retailer product image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    26: {
        "product_source_url": "https://bivihome.com.au/products/filosophy-mini-apple-cinnamon-twists-840g",
        "image_source_url": "http://bivihome.com.au/cdn/shop/files/Bivi_E4_BA_A7_E5_93_81_E5_9B_BE-3-2-4.jpg?v=1755658057",
        "verification_note": "Visually reviewed from Google Images: Filosophy Apple & Cinnamon filo pastry pack. Source pack is 840 g Mini Twists; workbook item is an 850 g Apple & Cinnamon Spiral, so this is a close brand/flavour-family image rather than an exact pack match.",
        "image_license": "Retailer product image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    31: {
        "product_source_url": "https://krinos.com/product/misko-fides500g-bag/",
        "image_source_url": "https://krinos.com/wp-content/uploads/2024/12/10106_1-B.jpg",
        "verification_note": "Visually reviewed from Google Images: Misko Fides noodles, 500 g bag; product family and size match the workbook listing.",
        "image_license": "Distributor product image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    33: {
        "product_source_url": "https://www.loblaws.ca/en/star-pasta/p/20994504_EA",
        "image_source_url": "https://digital.loblaws.ca/PCX/20994504_EA/en/1/520101014459_enfr_front_centre_marketing_GS1_Ecommerce_250.png",
        "verification_note": "Visually reviewed from Google Images: Misko 500 g star-shaped pasta front pack. The visible pasta style matches; the pack's printed shape number may differ from workbook code #23.",
        "image_license": "Retailer product image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
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
    46: {
        "product_source_url": "https://www.etsy.com/market/christian_wooden_stamps",
        "image_source_url": "https://i.etsystatic.com/7079056/r/il/6dfd64/8414794526/il_300x300.8414794526_5bxm.jpg",
        "verification_note": "Visually checked from Google Images: assortment of small wooden Christian text/prayer stamps. Relevant stamp image; exact FreshCo design is not confirmed.",
        "image_license": "Marketplace image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    50: {
        "product_source_url": "https://www.amazon.in/Nazareth-Store-Incense-Catholic-Vintage/dp/B00MCEUR78",
        "image_source_url": "https://m.media-amazon.com/images/I/61qn4xRY1OL.jpg",
        "verification_note": "Visually checked from Google Images: miniature brown/bronze Christian censer cup with cross finial; a relevant style reference, exact colour/material match not confirmed.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    51: {
        "product_source_url": "https://www.amazon.in/Zonon-Catholic-Christian-Aromatherapy-Fragrance/dp/B0F18MKHBX",
        "image_source_url": "https://m.media-amazon.com/images/I/71bH906LJUL.jpg",
        "verification_note": "Visually checked from Google Images: gold-coloured miniature censer with a cross; exact FreshCo model is not confirmed.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    52: {
        "product_source_url": "https://www.anastasisgiftshop.com/products/orthodox-incense-burner-in-burgundy-color-with-gold-tone-orthodox-cross",
        "image_source_url": "https://www.anastasisgiftshop.com/cdn/shop/products/BurgundyCeramicIncenseBurner_5_2048x.jpg?v=1598713244",
        "verification_note": "Visually checked from Google Images: burgundy Orthodox incense burner with gold-tone cross, matching the red censer product type.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    53: {
        "product_source_url": "https://www.amazon.in/Nazareth-Store-Charcoal-Catholic-Distiller/dp/B01LZU5004",
        "image_source_url": "https://m.media-amazon.com/images/I/81TwCF8XSQL._AC_UF350,350_QL80_.jpg",
        "verification_note": "Visually checked from Google Images: silver miniature Christian incense burner/censer; exact FreshCo model is not confirmed.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    63: {
        "product_source_url": "https://bakalikostore.nl/fr/products/graviera-cheese-mystakellis-from-lesvos-mytilene-250gr",
        "image_source_url": "https://bakalikostore.nl/cdn/shop/products/Mystakelli-Graviera-Cheese-from-Lesvos-Mytilene-250g_720x.jpg?v=1647567057",
        "verification_note": "Visually reviewed from Google Images: Mystakelli Graviera cheese wedge in a vacuum pack. The reference is a 250 g pack; the workbook lists 250 g x 12.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    65: {
        "product_source_url": "https://bakalikostore.nl/fr/products/mystakelli-kaseri-cheese-pdo-from-lesvos-mytilene-250g",
        "image_source_url": "https://bakalikostore.nl/cdn/shop/files/Mystakelli-Kaseri-Cheese-PDO-from-Lesvos-Mytilene-250g_720x.jpg?v=1726229134",
        "verification_note": "Visually reviewed from Google Images: Mystakelli Kasseri PDO cheese wedge, 250 g pack.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    66: {
        "product_source_url": "https://www.yolenis.com/en-gr/refrigerated-foods/dairy/feta-cheese-pdo-lemnos-hrysafis-family-200g.html",
        "image_source_url": "https://www.yolenis.com/media/catalog/product/f/e/feta-cheese-pdo-lemnos-hrysafis-family-550g.jpg",
        "verification_note": "Visually reviewed from Google Images: Hrysafi Lemnos Feta PDO front package. The reference image is listed as 550 g while the workbook line is sold by kg; pack weight is not a SKU match.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    70: {
        "product_source_url": "https://greekfoodemporiumny.com/product/kalamata-pitted-olives-deli-fresh-olives-1-lb/",
        "image_source_url": "https://greekfoodemporiumny.com/wp-content/uploads/2018/01/photoroom_20260118_141636.jpeg",
        "verification_note": "Visually reviewed from Google Images: pitted Kalamata olives sold deli-style. The product is a relevant olive reference; exact FreshCo preparation and weight are not confirmed.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    71: {
        "product_source_url": "https://mastihashop.com/en/products/chios-mastiha-tears-medium-10g",
        "image_source_url": "https://mastihashop.com/cdn/shop/files/10g_7.jpg?v=1780921641",
        "verification_note": "Visually reviewed from Google Images: ELMA/Chios Mastiha medium tears package marked 10 g.",
        "image_license": "Manufacturer/retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    72: {
        "product_source_url": "https://www.yolenis.com/en-gr/bakery-desserts/treats/chewing-gum-elma-classic-from-chios-chios-gum-mastic-growers-association-13g.html",
        "image_source_url": "https://www.yolenis.com/media/catalog/product/c/h/chewing-gum-elma-classic-from-chios-chios-gum-mastic-growers-association-13g.jpg",
        "verification_note": "Visually reviewed from Google Images: ELMA Classic Chios mastic chewing gum box, 13 g.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    73: {
        "product_source_url": "https://mastihashop.com/en/products/chewing-gum-sugar-free",
        "image_source_url": "https://mastihashop.com/cdn/shop/products/tsikhla-xioy-elma-sugar-free-5645309.jpg?v=1769611941",
        "verification_note": "Visually reviewed from Google Images: ELMA sugar-free Chios mastic gum retail pack, relevant to the 13 g workbook listing.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    74: {
        "product_source_url": "https://www.thanopoulos.gr/products/trofima-ektos-psugeiou/snacks/elma-tsixles-me-mastixa-xiou-dental-13g-66978753534ed70002a80a05/",
        "image_source_url": "https://wave-grocery.s3.eu-central-1.amazonaws.com/thanopoulos/products/5202772236228_1_1_F3D35EBC4A34EE96B89159F28DF7309F.jpg",
        "verification_note": "Visually reviewed from Google Images: ELMA Dental Chios mastic chewing gum package, 13 g.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    75: {
        "product_source_url": "https://threeolivespantry.com.au/products/elma-cinnamon-mastiha-chewing-gum",
        "image_source_url": "https://threeolivespantry.com.au/cdn/shop/files/ELMA-Cinnamon-Mastiha-Gum.png?v=1787285134",
        "verification_note": "Visually reviewed from Google Images: ELMA cinnamon mastiha gum package, matching product flavour and brand.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    76: {
        "product_source_url": "https://unboxgreece.com/product/chios-mastic-gum-with-mint-flavor-elma-13g/",
        "image_source_url": "https://unboxgreece.com/wp-content/uploads/2025/01/Chios-Mastic-Gum-with-Mint-Flavor-ELMA-13g.jpg",
        "verification_note": "Visually reviewed from Google Images: ELMA Chios mastic gum with mint/spearmint flavour, 13 g; a relevant brand/flavour image.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    77: {
        "product_source_url": "https://www.thanopoulos.gr/en/products/trofima-ektos-psugeiou/snacks/elma-tsixles-me-mastixa-xiou-triantafullo-13g-6697794f6b86ff00024c8db2/",
        "image_source_url": "https://wave-grocery.s3.eu-central-1.amazonaws.com/thanopoulos/products/5202772636721_1_1_99CC0433851AB74AF13D914A48E3B736.jpg",
        "verification_note": "Visually reviewed from Google Images: ELMA rose-flavoured Chios mastic gum package, 13 g.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    78: {
        "product_source_url": "https://cheapbasket.com.cy/gum-ELMA-mastic-13g-sugar-free-Lemon/5202772636424",
        "image_source_url": "https://cheapbasket.com.cy/media/5b/40/ee/1758093233/01995685cd5e72fb9035c41abf11f6d6.jpg.jpg?ts=1758093233",
        "verification_note": "Visually reviewed from Google Images: ELMA lemon-flavoured sugar-free gum, 13 g; flavour and pack size match the workbook listing.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    79: {
        "product_source_url": "https://www.greekseller.com/sweets/snacks/elma-cappuccino-13gr",
        "image_source_url": "https://www.greekseller.com/images/products/original/elma-cappuccino-13gr.png",
        "verification_note": "Visually reviewed from Google Images: ELMA cappuccino mastic gum package marked 13 g.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    84: {
        "product_source_url": "https://www.anastasisgiftshop.com/products/greek-orthodox-ceramic-vigil-oil-lamp-with-icon-of-theotokos",
        "image_source_url": "https://www.anastasisgiftshop.com/cdn/shop/products/CeramicVigiLamp_1_2048x.jpg?v=1629931670",
        "verification_note": "Visually reviewed from Google Images: blue-and-white Orthodox ceramic vigil lamp with Theotokos icon, matching the product type and colour. Exact Estia-branded item not confirmed.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    85: {
        "product_source_url": "https://www.etsy.com/listing/1836821250/ceramic-vigil-lamp-kandili-with-virgin",
        "image_source_url": "https://i.etsystatic.com/55029732/r/il/70bf16/6532661420/il_570xN.6532661420_ply6.jpg",
        "verification_note": "Visually reviewed from Google Images: brown ceramic Orthodox vigil lamp with icon; broadly matches product name, though the Estia model is not confirmed.",
        "image_license": "Marketplace image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    86: {
        "product_source_url": "https://www.etsy.com/in-en/listing/1836819358/ceramic-vigil-lamp-kandili-with-virgin",
        "image_source_url": "https://i.etsystatic.com/55029732/r/il/1f007c/6580766029/il_570xN.6580766029_555o.jpg",
        "verification_note": "Visually reviewed from Google Images: burgundy ceramic Orthodox vigil lamp with Virgin Mary icon, matching the product type and colour; exact Estia design not confirmed.",
        "image_license": "Marketplace image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    87: {
        "product_source_url": "https://agoragreekdelicacies.co.uk/product/halva-pistachio-400gr-olympos/",
        "image_source_url": "https://agoragreekdelicacies.co.uk/wp-content/uploads/2020/02/Halva-with-Pistachios-400g-Olympos-e1771506337997.png",
        "verification_note": "Visually reviewed from Google Images: pistachio halva product pack. Workbook describes round halva with pistachio cream; close product-family match, not an exact formulation or size confirmation.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    88: {
        "product_source_url": "https://www.facebook.com/dimitrasdishes/videos/your-oven-is-full-you-still-need-dessert-make-this-my-apple-cinnamon-halva-with-/1760388901683783/",
        "image_source_url": "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=1760388901683783&get_thumbnail=1",
        "verification_note": "Visually reviewed from Google Images: Greek apple-cinnamon halva dessert image; recipe presentation is relevant to the listed flavour, but is not a product pack shot.",
        "image_license": "Recipe/social image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    90: {
        "product_source_url": "https://www.anatoli-spices.gr/en/service/%CE%BA%CE%B1%CE%BD%CE%AD%CE%BB%CE%BB%CE%B1-%CE%BE%CF%8D%CE%BB%CE%BF/",
        "image_source_url": "https://www.anatoli-spices.gr/wp-content/uploads/2021/01/kanellaxylo.png",
        "verification_note": "Visually reviewed from Google Images: Anatoli cinnamon sticks; spice and brand match the 50 g workbook listing, though the image may not show the exact pack size.",
        "image_license": "Manufacturer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    91: {
        "product_source_url": "https://www.anatoli-spices.gr/en/service/%CF%80%CE%B9%CF%80%CE%AD%CF%81%CE%B9-%CE%BC%CE%B1%CF%8D%CF%81%CE%BF-%CF%84%CF%81%CE%B9%CE%BC%CE%BC%CE%AD%CE%BD%CE%BF/",
        "image_source_url": "https://www.anatoli-spices.gr/wp-content/uploads/2020/12/PIPERI-TRIMMENO-1.png",
        "verification_note": "Visually reviewed from Google Images: Anatoli ground black pepper; brand and spice match, exact 60 g jar is not confirmed.",
        "image_license": "Manufacturer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    92: {
        "product_source_url": "https://greekshop.com.au/product/anatoli-ceylon-cinnamon-40g/",
        "image_source_url": "https://greekshop.com.au/wp-content/uploads/2025/03/ANATOLI-Ceylon-Cinnamon-40g.jpg",
        "verification_note": "Visually reviewed from Google Images: Anatoli Ceylon cinnamon retail pack marked 40 g.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    93: {
        "product_source_url": "https://www.anatoli-spices.gr/en/service/%CE%B3%CE%B1%CF%81%CF%8D%CF%86%CE%B1%CE%BB%CE%BB%CE%BF-%CF%84%CF%81%CE%B9%CE%BC%CE%BC%CE%AD%CE%BD%CE%BF-2/",
        "image_source_url": "https://www.anatoli-spices.gr/wp-content/uploads/2020/12/GARYFALLO-TRIMMENO.png",
        "verification_note": "Visually reviewed from Google Images: Anatoli ground cloves; brand and spice match. The workbook's listed 45 g x 8 pack is not verified in the image.",
        "image_license": "Manufacturer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    94: {
        "product_source_url": "https://www.anatoli-spices.gr/en/service/%CE%BC%CE%BF%CF%83%CF%87%CE%BF%CE%BA%CE%AC%CF%81%CF%85%CE%B4%CE%BF-%CF%84%CF%81%CE%B9%CE%BC%CE%BC%CE%AD%CE%BD%CE%BF-2/",
        "image_source_url": "https://www.anatoli-spices.gr/wp-content/uploads/2020/09/MOSXOKARYDO-TRIMMENO.png",
        "verification_note": "Visually reviewed from Google Images: Anatoli ground nutmeg; brand and spice match. The workbook's listed 45 g x 8 pack is not verified in the image.",
        "image_license": "Manufacturer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    95: {
        "product_source_url": "https://greekshop.com.au/product/anatoli-mix-for-gyros-45g/",
        "image_source_url": "https://greekshop.com.au/wp-content/uploads/2025/03/ANATOLI-Mix-for-Gyros-45g.jpg",
        "verification_note": "Visually reviewed from Google Images: Anatoli Mix for Gyros package marked 45 g.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    96: {
        "product_source_url": "https://greekshop.com.au/product/anatoli-sodium-bicarbonate-380g/",
        "image_source_url": "https://greekshop.com.au/wp-content/uploads/2025/03/ANATONI-Sodium-Bicarbonate-380g.jpg",
        "verification_note": "Visually reviewed from Google Images: Anatoli Sodium Bicarbonate package marked 380 g.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    97: {
        "product_source_url": "https://www.foodomarket.com/en-gb/products/beans/kalamata-whole-olives",
        "image_source_url": "https://cdn.foodomarket.com/media/cache/front_card_2x/bd/f9/c80f6acbf282c1dd2147655ab83a.jpg",
        "verification_note": "Visually reviewed from Google Images: whole Kalamata olives, relevant to the bulk whole-olive workbook listing; exact supplier and grade are not confirmed.",
        "image_license": "Retailer/wholesale image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    98: {
        "product_source_url": "https://loumidisfoods.com/product/super-mammoth-green-pitted-olives-10-kg/",
        "image_source_url": "https://loumidisfoods.com/wp-content/uploads/2020/07/KLGP91.jpg",
        "verification_note": "Visually reviewed from Google Images: large green mammoth olives, pitted, in bulk. Workbook item says Volvos Mammoth; supplier/brand equivalence and pitted status are not confirmed.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    99: {
        "product_source_url": "https://harkola.online/shop/canned-products/olives/olives-black-dry-halkidikis-12kg/",
        "image_source_url": "https://harkola.online/wp-content/uploads/2017/01/OLIVES-BLACK-DRY-HALKIDIKIS.jpg",
        "verification_note": "Visually reviewed from Google Images: black dry Halkidiki olives sold in bulk; product type matches the workbook line.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    100: {
        "product_source_url": "http://www.kebia.com.au/product/thassos-dry-olives-5kg/",
        "image_source_url": "https://i0.wp.com/www.kebia.com.au/wp-content/uploads/2020/03/439a.jpg?fit=600%2C600",
        "verification_note": "Visually reviewed from Google Images: Thassos dry olives, matching the named product family; exact pack size is not confirmed.",
        "image_license": "Australian retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    103: {
        "product_source_url": "https://www.agrino.gr/en/proionta/se-xafniazei/ryzogkofretes-klasikes",
        "image_source_url": "https://www.agrino.gr/sites/default/files/styles/product_detail/public/media/product/Agrino%20render%207%20flat_Klassiki_En-min.png?itok=d04NkePj",
        "verification_note": "Visually reviewed from Google Images: Agrino classic/lightly salted rice cakes; brand and product family match, exact multipack presentation not confirmed.",
        "image_license": "Manufacturer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    104: {
        "product_source_url": "https://unboxgreece.com/product/oregano-rice-cakes-110g/",
        "image_source_url": "https://unboxgreece.com/wp-content/uploads/2025/09/Orerano-rice-cakes-by-agrino.jpg",
        "verification_note": "Visually reviewed from Google Images: Agrino oregano rice cakes, 110 g.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    105: {
        "product_source_url": "https://balaskas.shop/en/product/agrino-cinnamon-rice-cakes-14pcs-115gr/",
        "image_source_url": "https://balaskas.shop/wp-content/uploads/2021/02/5201502210057-800x800.jpg",
        "verification_note": "Visually reviewed from Google Images: Agrino cinnamon rice cakes, 115 g.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    106: {
        "product_source_url": "https://sohrabfoods.com.au/product/coconut-toffee-atlas-fine-foods",
        "image_source_url": "https://sohrabfoods.com.au/storage/media/product_img/273207314.jpg",
        "verification_note": "Visually reviewed from Google Images: coconut toffee sold by an Australian retailer. Coconut-toffee type matches; Ibis brand and exact bag are not confirmed.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    107: {
        "product_source_url": "https://www.amazon.com/Fantis-Greek-Fruit-Jelly-Candies/dp/B00Q1RYQPQ",
        "image_source_url": "https://m.media-amazon.com/images/I/51WSDZUQzeL._AC_.jpg",
        "verification_note": "Visually reviewed from Google Images: Greek Ibis/Fantis fruit jelly candies. This is a brand/product-family reference; strawberry Fourre flavour is not confirmed.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    108: {
        "product_source_url": "https://cyprustime.com.au/products/greek-time-spice-range-full-set-discount",
        "image_source_url": "https://cyprustime.com.au/cdn/shop/files/Gyro_and_Souvlaki_Spice_1080x.png?v=1787022711",
        "verification_note": "Visually reviewed from Google Images: Greek Time Gyro and Souvlaki spice pack. Workbook's 150 g line matches the product family; image found on the range listing.",
        "image_license": "Australian retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    109: {
        "product_source_url": "https://greekshop.com.au/product/greektime-zorbas-souvla-spice-mix-150gr/",
        "image_source_url": "https://greekshop.com.au/wp-content/uploads/2026/07/GREEKTIME-Zorbas-Souvla-Spice-Mix-150gr.jpg",
        "verification_note": "Visually reviewed from Google Images: GreekTime Zorba's Souvla spice package marked 150 g.",
        "image_license": "Australian retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    110: {
        "product_source_url": "https://cyprustime.com.au/products/grrek-time-spice-range-zorba-souvla-spice-mix-150g-copy",
        "image_source_url": "https://cyprustime.com.au/cdn/shop/files/Hellenic_Fish_1080x.png?v=1787022197",
        "verification_note": "Visually reviewed from Google Images: Greek Time Hellenic Fish spice pack. The listing page URL is a reused range-product page and its slug is not fish-specific; the image asset identifies the fish variant.",
        "image_license": "Australian retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    111: {
        "product_source_url": "https://www.ebay.co.uk/itm/254195213054",
        "image_source_url": "https://i.ebayimg.com/images/g/gZQAAOSwCuBgIB4f/s-l400.jpg",
        "verification_note": "Visually reviewed from Google Images: Greek seasoning mix for potatoes, 150 g, with the listed barcode. Image is a close potato/chips seasoning reference; exact Greek Time brand is not confirmed.",
        "image_license": "Marketplace image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    112: {
        "product_source_url": "https://cyprustime.com.au/products/grrek-time-spice-range-greek-chips-and-potato-seasoning-150g-copy",
        "image_source_url": "https://cyprustime.com.au/cdn/shop/files/Spice_20b0bf6a-0ccf-4d1a-9162-477b88c6fb3b_1080x.png?v=1787021618",
        "verification_note": "Visually reviewed from Google Images: Greek Time Hot and Spicy spice mix, 150 g. Retailer page slug may be reused for another range item; image card title identifies the hot/spicy variant.",
        "image_license": "Australian retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    116: {
        "product_source_url": "https://bakalikostore.nl/products/hotos-feta-cheese-200g",
        "image_source_url": "https://bakalikostore.nl/cdn/shop/products/Hotos-Feta-Cheese-P_D_O_-200g.jpg?v=1668197039",
        "verification_note": "Visually reviewed from Google Images: Hotos Feta PDO package. Reference shows 200 g; workbook line is sold by kg, so this is a brand/product-family image rather than a unit-weight match.",
        "image_license": "Retailer image found via Google Images; source recorded; commercial reuse permission not independently confirmed.",
    },
    117: {
        "product_source_url": "https://gogreek.shop/products/hotos-feta-cheese",
        "image_source_url": "https://gogreek.shop/cdn/shop/products/HotosFeta400g.png?v=1695348615&width=1946",
        "verification_note": "Visually reviewed from Chrome image search: Hotos Feta 400 g pack; brand, cheese type, and size match. The search result identifies Hotos, though the displayed image is a retailer pack image.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    118: {
        "product_source_url": "https://bakalikostore.nl/products/hotos-feta-cheese-1kg",
        "image_source_url": "https://bakalikostore.nl/cdn/shop/products/Hotos-Feta-Cheese-P_D_O_-1kg_300x300.jpg?v=1668196967",
        "verification_note": "Visually reviewed from Chrome image search: Hotos Feta PDO 1 kg pack; brand, cheese type, and size match.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    119: {
        "product_source_url": "https://www.bafasdairy.gr/en/product/goat-cheese-in-brine-1kg/",
        "image_source_url": "https://www.bafasdairy.gr/wp-content/uploads/2022/06/3d-KATSIKITSIO-1kl-1-1.jpg",
        "verification_note": "Visually reviewed from Chrome image search: goat cheese in brine, 1 kg. Cheese type and size match; the image is Bafas, not the workbook's Hotos brand.",
        "image_license": "Manufacturer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    120: {
        "product_source_url": "https://www.bafasdairy.gr/en/product/goat-cheese-in-brine-400gr/",
        "image_source_url": "https://www.bafasdairy.gr/wp-content/uploads/2022/06/3d-KATSIKITSIO-400GR.jpg",
        "verification_note": "Visually reviewed from Chrome image search: goat cheese in brine, 400 g. Cheese type and size match; the image is Bafas, not the workbook's Hotos brand.",
        "image_license": "Manufacturer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    122: {
        "product_source_url": "https://cheapbasket.com.cy/THE-MANNA-mini-rusks-with-olive-oil-400g-Kythirian-type/5201882006646",
        "image_source_url": "https://cheapbasket.com.cy/media/2a/d5/ec/1752684825/019814280c2c72b2b3092be0830b53da.jpg.jpg?ts=1752684825",
        "verification_note": "Visually reviewed from Chrome image search: The Manna mini olive-oil rusks, 400 g.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    123: {
        "product_source_url": "https://balaskas.shop/en/product/to-manna-mini-barley-rusks-400g/",
        "image_source_url": "https://balaskas.shop/wp-content/uploads/2025/11/Mini-%CE%BA%CE%BF%CF%85%CE%BB%CE%BF%CF%8D%CF%81%CE%B5%CF%82-800x800.png",
        "verification_note": "Visually reviewed from Chrome image search: The Manna mini barley rusks, 400 g. Workbook specifies mini halves; this reference shows the same mini-rusk product family, with shape not confirmed.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    124: {
        "product_source_url": "https://balaskas.shop/en/product/to-manna-barley-rusks-no-added-salt-400gr/",
        "image_source_url": "https://balaskas.shop/wp-content/uploads/2021/02/5201882004444.jpg",
        "verification_note": "Visually reviewed from Chrome image search: The Manna wholegrain barley rusks, no added salt, 400 g.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    125: {
        "product_source_url": "https://greektable.ca/?product=the-manna-olive-oil-rusk-500g",
        "image_source_url": "https://greektable.ca/wp-content/uploads/2020/04/THE-MANNA-OLIVE-OIL-Rusks.jpg",
        "verification_note": "Visually reviewed from Chrome image search: The Manna olive-oil rusks, 500 g.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    126: {
        "product_source_url": "https://greekshop.com.au/product/manna-olive-oil-rusks-w-cinnamon-350gr/",
        "image_source_url": "https://greekshop.com.au/wp-content/uploads/2021/04/MANA-Olive-Oli-Rusks-w-Cinnamon-350gr-5.00.jpg",
        "verification_note": "Visually reviewed from Chrome image search: Manna cinnamon olive-oil rusks. Reference is 350 g; workbook line says wheat with cinnamon, 380 g, so the pack size and exact variety are not confirmed.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    127: {
        "product_source_url": "https://www.mygreekfoodmarket.com/products/p/the-manna-olive-oil-biscuits-with-orange-juice-cinnamon-290g",
        "image_source_url": "https://images.squarespace-cdn.com/content/v1/66620076a02a8e185914eb66/8f7dace0-38f2-4cb5-92a1-5ceb1fc0c1a1/The+Manna+Olive+Oil+Biscuits+with+orange+juice+and+cinnamon.png",
        "verification_note": "Visually reviewed from Chrome image search: Manna olive-oil biscuits, 290 g. This reference includes orange and cinnamon flavouring, which is not specified in the workbook line.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    128: {
        "product_source_url": "https://mediterraneanfoodsny.com/products/tsatsaronakis-manna-cretan-rye-rusks-400g/",
        "image_source_url": "https://mediterraneanfoodsny.com/wp-content/uploads/2024/01/manna-rye-rusks-1_1.jpg",
        "verification_note": "Visually reviewed from Chrome image search: Tsatsaronakis Manna rye rusks, 400 g.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    129: {
        "product_source_url": "https://www.agrexpo.gr/figs/crown-figs/",
        "image_source_url": "https://www.agrexpo.gr/wp-content/uploads/2023/06/agrexpo-figs-product-figs_package_round-1024x988.png",
        "verification_note": "Visually reviewed from Chrome image search: Crown dried figs package from Agrexpo; product family matches. Exact 250 g pack and variety are not shown in the search result.",
        "image_license": "Producer/distributor image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    130: {
        "product_source_url": "https://greekshop.com.au/product/manna-dakos-barley-rusks-400gr/",
        "image_source_url": "https://greekshop.com.au/wp-content/uploads/2021/08/MANNA-Dakos-Barley-Rusks-400gr-9.00.jpg",
        "verification_note": "Visually reviewed from Chrome image search: Manna Dakos barley rusks, 400 g. Workbook specifies barley halves; exact cut/style is not confirmed.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    131: {
        "product_source_url": "https://globalfoodsdirect.co.nz/index.php?route=product/product&product_id=891",
        "image_source_url": "https://globalfoodsdirect.co.nz/image/cache/data/Greek%20Oregano2-500x500.png",
        "verification_note": "Visually reviewed from Chrome image search: Greek oregano bunch, 40 g. Product type and size match; Oros brand is not confirmed in the photo.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    132: {
        "product_source_url": "https://www.elgrecoteas.com/site/en/product/mountain-tea-bunch-40g/",
        "image_source_url": "https://www.elgrecoteas.com/site/wp-content/uploads/2023/05/MOUNTAINTEABUNCH_PAPERCARD-1200x1200.jpg",
        "verification_note": "Visually reviewed from Chrome image search: Greek mountain tea bunch, 40 g. Product type and size match; Oros brand is not confirmed in the photo.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    133: {
        "product_source_url": "https://theolivest.com/products/stathakis-pefkothymaromelo-of-crete-pdo-pine-thyme-honey-450gr",
        "image_source_url": "https://theolivest.com/cdn/shop/files/D3477727-8CA5-4C2E-BAD6-94905A275DC3_600x.png?v=1772857059",
        "verification_note": "Visually reviewed from Chrome image search: Stathakis Cretan honey, 450 g.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    134: {
        "product_source_url": "https://papadopoulou.gr/en/brand/sandwich-biscuits/",
        "image_source_url": "https://papadopoulou.gr/wp-content/uploads/2024/04/720x720-lemoni-360x360.webp",
        "verification_note": "Visually reviewed from Chrome image search: Papadopoulou lemon sandwich biscuits. Official brand image; exact 200 g presentation is not shown in the result.",
        "image_license": "Manufacturer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    135: {
        "product_source_url": "https://titanfoods.com/papadopoulos-petit-beurre-225g-pack/",
        "image_source_url": "https://cdn11.bigcommerce.com/s-kg39v/images/stencil/1280x1280/products/1052/4007/papadop_petit_group_2__96648.1629745253.jpg?c=2",
        "verification_note": "Visually reviewed from Chrome image search: Papadopoulos Petit Beurre biscuits, 225 g.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    136: {
        "product_source_url": "https://thegreekonline.com/products/biscuits-miranda-papadopoulos",
        "image_source_url": "https://thegreekonline.com/cdn/shop/files/MirandaBiscuit1_a754a18e-7ebc-426f-8ddb-38e11a042c7a.jpg?v=1724868726&width=1946",
        "verification_note": "Visually reviewed from Chrome image search: Papadopoulos Miranda biscuits, 250 g.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    137: {
        "product_source_url": "https://balaskas.shop/en/product/papadopoulou-sandwich-biscuits-with-orange-cream-200gr/",
        "image_source_url": "https://balaskas.shop/wp-content/uploads/2020/05/Screenshot-2026-01-14-133741.png",
        "verification_note": "Visually reviewed from Chrome image search: Papadopoulou orange-cream sandwich biscuits, 200 g.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    138: {
        "product_source_url": "https://wolt.com/en/cyp/limassol/venue/metro-supermarket-limassol/papadopoulou-strawberry-sandwich-biscuits-200g-itemid-64615666413c3cd700f2c6f6",
        "image_source_url": "https://imageproxy.wolt.com/menu/menu-images/622e525b1d17268dd58b81e4/d0f1e2cc-fc99-11f0-b935-f6e5b62541b4_52842.jpg",
        "verification_note": "Visually reviewed from Chrome image search: Papadopoulou strawberry sandwich biscuits, 200 g.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    139: {
        "product_source_url": "https://gcc.luluhypermarket.com/en-ae/papadopoulos-digestive-biscuits-250-g/p/2279736",
        "image_source_url": "https://bf1af2.akinoncloudcdn.com/products/2024/12/14/216164/78b6b117-0104-499f-8c60-34219bcb2655_size3840_cropCenter.jpg",
        "verification_note": "Visually reviewed from Chrome image search: Papadopoulos Digestive biscuits, 250 g.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    140: {
        "product_source_url": "https://discountstore.pk/products/papadopoulos-digestive-biscuits-with-wholegrain-flour-sugar-free-250g",
        "image_source_url": "https://discountstore.pk/cdn/shop/files/71RCkRLq_GL_1200x.jpg?v=1762434922",
        "verification_note": "Visually reviewed from Chrome image search: Papadopoulos wholegrain Digestive biscuits, sugar-free, 250 g.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    141: {
        "product_source_url": "https://greek-food-shop.com/shop/biscuits/papadopoulos-petit-beurre-biscuit-sugar-free/",
        "image_source_url": "https://greek-food-shop.com/wp-content/uploads/2023/03/BISCUITSPAPADOPOULOSPETITBEURRENOADDEDSUGAR225g.jpg",
        "verification_note": "Visually reviewed from Chrome image search: Papadopoulos Petit Beurre sugar-free biscuits, 225 g.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    142: {
        "product_source_url": "https://natmar.co.uk/products-by-country/wheat-rusks-goldies-255g-papadopoulos",
        "image_source_url": "https://natmar.co.uk/image/thumbnails/19/75/suhari_goldies_255_g_image_5ea2d8d464892_1280x1280_2_jpeg-104285-500x500.jpeg",
        "verification_note": "Visually reviewed from Chrome image search: Papadopoulos Goldies wheat rusks, 255 g.",
        "image_license": "Retailer image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
    },
    3: {
        "product_source_url": "https://authenticflavourco.com.au/products/dodoni-feta-1kg",
        "image_source_url": "https://cdn.shopify.com/s/files/1/0619/8876/5854/products/DodoniFeta1kg2.webp?v=1658211619",
        "verification_note": "Reviewed in the inherited audit: Dodoni feta tub image is relevant to the workbook's 1 kg item, but the source package states 1.5 kg net / 1.1 kg drained; pack size differs.",
        "image_license": "Retailer product image found via browser image search; source recorded; commercial reuse permission not independently confirmed.",
        "verified": True,
    },
}

# Browser-researched image matches are kept as a separate audit artifact so
# additional reviewed batches do not require editing the generator itself.
EXTRA_MATCHES_PATH = ROOT / "src/data/manual-browser-image-matches.json"
if EXTRA_MATCHES_PATH.exists():
    EXTRA_MATCHES = json.loads(EXTRA_MATCHES_PATH.read_text())
    for row_key, match in EXTRA_MATCHES.items():
        MANUAL_IMAGE_MATCHES[int(row_key)] = match

# Final browser-researched candidates and replacement URLs are separated from
# the historical batch so a temporary source outage can be audited and fixed
# without losing the earlier search record.
IMAGE_OVERRIDES_PATH = ROOT / "src/data/manual-browser-image-overrides.json"
if IMAGE_OVERRIDES_PATH.exists():
    IMAGE_OVERRIDES = json.loads(IMAGE_OVERRIDES_PATH.read_text())
    for row_key, match in IMAGE_OVERRIDES.items():
        MANUAL_IMAGE_MATCHES[int(row_key)] = match

GENERIC_IMAGE_MATCHES_PATH = ROOT / "src/data/manual-generic-image-matches.json"
if GENERIC_IMAGE_MATCHES_PATH.exists():
    GENERIC_IMAGE_MATCHES = json.loads(GENERIC_IMAGE_MATCHES_PATH.read_text())
    for row_key, match in GENERIC_IMAGE_MATCHES.items():
        product_slug, photo_slug, photo_id = match[:3]
        storage_object_key = match[3] if len(match) > 3 else f"products/{product_slug}/generic-20261027.jpg"
        row_number = int(row_key)
        MANUAL_IMAGE_MATCHES[row_number] = {
            "product_source_url": f"https://www.pexels.com/photo/{photo_slug}/",
            "image_source_url": f"https://images.pexels.com/photos/{photo_id}/pexels-photo-{photo_id}.jpeg?cs=tinysrgb&w=1400",
            "verification_note": "Generic, unbranded illustrative food photography selected from a Pexels search for this workbook item; it depicts the food, not a FreshCo package.",
            "image_license": "Pexels License: free to use, including on e-commerce websites; generic unbranded illustrative image, not exact product packaging. Source retained. https://www.pexels.com/license/",
            "storage_object_key": storage_object_key,
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


def normalize_subcategory(category: str, value: str) -> str:
    """Tidy display-only spelling variations without changing taxonomy meaning."""
    result = clean(value)
    if category.casefold() == "cheese" and result.casefold().replace(" ", "") == "feta(loose)":
        return "Feta (Loose)"
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
            normalize_subcategory(clean(values[5]), clean(values[6])).casefold(),
            clean(values[7]).casefold(), str(parse_price(values[1])),
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
        subcategory_1 = normalize_subcategory(category, clean(raw_sub1))
        subcategory_2 = clean(raw_sub2)
        pack = pack_from_name(name)
        source_active = bool(source["source_active"])
        active_rows += int(source_active)
        missing_price = price is None
        workbook_unit_missing = not unit
        missing_price_count += int(source_active and missing_price)
        missing_unit_count += int(source_active and workbook_unit_missing)

        # Packaged retail items with a confirmed price but a blank workbook
        # unit are sold as one item. Keep the source omission auditable in
        # workbook_unit while applying the agreed EA (each) convention.
        if source_active and price is not None and workbook_unit_missing:
            unit = "EA"
        missing_unit = not unit

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
                verification_note = LEGACY_IMAGE_NOTES.get(row_number) or "Reused from the previously audited catalogue row; rechecked the new workbook product and relevant image."
                image_match_status = "verified"

        reasons = []
        if not source_active:
            reasons.append("Dormant: workbook row is not highlighted green.")
        if missing_price:
            reasons.append("Workbook price is missing; do not sell until confirmed.")
        if missing_unit:
            reasons.append("Workbook unit is missing; do not sell until confirmed.")
        if image_match_status != "verified":
            reasons.append(verification_note or "No product-relevant image has been visually reviewed yet.")
        # Green workbook rows belong in the public catalogue even when a price
        # is still missing. Their inventory stays at zero below, so they can be
        # discovered but cannot be purchased until the client supplies pricing.
        publishable = source_active and image_match_status == "verified" and bool(image_source_url) and bool(product_source_url) and (missing_price or bool(unit))

        image_extension = ".png" if row_number in {8, 16, 61} else ".jpg"
        storage_object_key = None
        if image_source_url and image_match_status == "verified":
            storage_object_key = MANUAL_IMAGE_MATCHES.get(row_number, {}).get("storage_object_key") or f"products/{slug}/primary{image_extension}"
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
            "published_reviewed_image_products": len(published),
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
        "published_reviewed_image_products": len(published),
        "duplicates": duplicate_sources,
        "categories": dict(Counter(product["categories"]["name"] for product in products)),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
