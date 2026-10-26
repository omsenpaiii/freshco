-- Safe additive migration for the client workbook catalog import.
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_source_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_license TEXT;

ALTER TABLE products ADD COLUMN IF NOT EXISTS image_license TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_object_key TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_active BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_workbook TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_row INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_item_name TEXT;

ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image_source_url TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image_license TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS products_source_row_idx
  ON products(source_workbook, source_row)
  WHERE source_workbook IS NOT NULL;
