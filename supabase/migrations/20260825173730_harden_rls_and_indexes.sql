ALTER FUNCTION public.handle_new_user() SET search_path = '';
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_category_product_counts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_category_product_counts() TO service_role;

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Allow users to view their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Allow users to manage their own addresses" ON public.addresses;
CREATE POLICY "Users can manage their own addresses" ON public.addresses
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = profile_id)
  WITH CHECK ((SELECT auth.uid()) = profile_id);

DROP POLICY IF EXISTS "Allow users to manage their own cart" ON public.cart_items;
CREATE POLICY "Users can manage their own cart" ON public.cart_items
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = profile_id)
  WITH CHECK ((SELECT auth.uid()) = profile_id);

DROP POLICY IF EXISTS "Allow users to manage their own wishlist" ON public.wishlist_items;
CREATE POLICY "Users can manage their own wishlist" ON public.wishlist_items
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = profile_id)
  WITH CHECK ((SELECT auth.uid()) = profile_id);

DROP POLICY IF EXISTS "Allow users to view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = profile_id);

CREATE INDEX IF NOT EXISTS addresses_profile_id_idx ON public.addresses(profile_id);
CREATE INDEX IF NOT EXISTS blog_comments_post_id_idx ON public.blog_comments(post_id);
CREATE INDEX IF NOT EXISTS cart_items_product_id_idx ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS orders_profile_id_idx ON public.orders(profile_id);
CREATE INDEX IF NOT EXISTS wishlist_items_product_id_idx ON public.wishlist_items(product_id);
