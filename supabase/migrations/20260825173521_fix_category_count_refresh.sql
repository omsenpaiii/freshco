CREATE OR REPLACE FUNCTION public.refresh_category_product_counts()
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  UPDATE public.categories c
  SET products_count = (
    SELECT COUNT(*) FROM public.products p
    WHERE p.category_id = c.id AND p.status = 'published'
  )
  WHERE c.id IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.refresh_category_product_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_category_product_counts() TO service_role;
