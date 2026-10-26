import { redirect } from 'next/navigation'
import AdminPanel from '@/components/admin/admin-panel'
import { getAdminSessionUser } from '@/lib/admin'
import { getAdminCatalog } from '@/lib/admin-catalog'

export default async function AdminPage() {
  const user = await getAdminSessionUser()

  if (!user) {
    redirect('/account/login')
  }

  const { categories, products } = await getAdminCatalog()

  return (
    <AdminPanel
      initialCategories={categories}
      initialProducts={products}
      adminEmail={user.email || ''}
    />
  )
}
