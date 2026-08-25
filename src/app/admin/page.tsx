import { redirect } from 'next/navigation'
import AdminPanel from '@/components/admin/admin-panel'
import { getAdminSessionUser } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase-admin'

export default async function AdminPage() {
  const user = await getAdminSessionUser()

  if (!user) {
    redirect('/account/login')
  }

  const supabase = createAdminClient()
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('products').select('*, categories(name, slug), product_variants(*)').order('created_at', { ascending: false }),
  ])

  return (
    <AdminPanel
      initialCategories={categories || []}
      initialProducts={(products || []).map((product) => ({ ...product, price: Number(product.price), product_variants: (product.product_variants || []).map((variant: { price: number | string; [key: string]: unknown }) => ({ ...variant, price: Number(variant.price) })) }))}
      adminEmail={user.email || ''}
    />
  )
}
