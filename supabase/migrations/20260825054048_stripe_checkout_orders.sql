-- Stripe-hosted Checkout order lifecycle and server-only fulfilment.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'aud',
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.orders ALTER COLUMN shipping_country SET DEFAULT 'Australia';
ALTER TABLE public.addresses ALTER COLUMN country SET DEFAULT 'Australia';

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'expired', 'refunded'));
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_currency_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_currency_check
  CHECK (currency = LOWER(currency) AND CHAR_LENGTH(currency) = 3);

CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_checkout_session_id_key
  ON public.orders(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_payment_status_created_at_idx
  ON public.orders(payment_status, created_at DESC);

DROP POLICY IF EXISTS "Allow users to insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow users to insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow users to view their own order items" ON public.order_items;
CREATE POLICY "Users can view their own order items" ON public.order_items
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE public.orders.id = public.order_items.order_id
        AND public.orders.profile_id = (SELECT auth.uid())
    )
  );

REVOKE INSERT, UPDATE, DELETE ON TABLE public.orders, public.order_items FROM anon, authenticated;
GRANT SELECT ON TABLE public.orders, public.order_items TO authenticated;
GRANT ALL ON TABLE public.orders, public.order_items TO service_role;

CREATE OR REPLACE FUNCTION public.complete_stripe_order(
  p_order_id UUID,
  p_session_id TEXT,
  p_payment_intent_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_payment_status TEXT;
  order_line RECORD;
  updated_variant_product_id BIGINT;
BEGIN
  SELECT payment_status INTO current_payment_status
  FROM public.orders
  WHERE id = p_order_id
    AND stripe_checkout_session_id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stripe order/session mismatch';
  END IF;

  IF current_payment_status = 'paid' THEN
    RETURN TRUE;
  END IF;

  FOR order_line IN
    SELECT variant_id, quantity
    FROM public.order_items
    WHERE order_id = p_order_id
    ORDER BY id
  LOOP
    IF order_line.variant_id IS NULL THEN
      RAISE EXCEPTION 'Order item is missing a variant';
    END IF;

    UPDATE public.product_variants
    SET inventory_quantity = inventory_quantity - order_line.quantity
    WHERE id = order_line.variant_id
      AND inventory_quantity >= order_line.quantity
    RETURNING product_id INTO updated_variant_product_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient inventory for variant %', order_line.variant_id;
    END IF;
  END LOOP;

  UPDATE public.products AS product
  SET inventory_quantity = inventory.total_inventory
  FROM (
    SELECT variant.product_id, SUM(variant.inventory_quantity)::INTEGER AS total_inventory
    FROM public.product_variants AS variant
    WHERE variant.product_id IN (
      SELECT DISTINCT item.product_id
      FROM public.order_items AS item
      WHERE item.order_id = p_order_id
    )
    GROUP BY variant.product_id
  ) AS inventory
  WHERE product.id = inventory.product_id;

  UPDATE public.orders
  SET payment_status = 'paid',
      status = 'processing',
      stripe_payment_intent_id = p_payment_intent_id,
      paid_at = NOW(),
      updated_at = NOW()
  WHERE id = p_order_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_stripe_order(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_stripe_order(UUID, TEXT, TEXT) TO service_role;
