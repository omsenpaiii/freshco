import { redirect } from 'next/navigation'
import AdminPanel from '@/components/admin/admin-panel'
import { getCategories, getProducts } from '@/lib/db'
import { getAdminSessionUser } from '@/lib/admin'

export default async function AdminPage() {
  const user = await getAdminSessionUser()

  if (!user) {
    redirect('/account/login')
  }

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ])

  return (
    <AdminPanel
      initialCategories={categories}
      initialProducts={products}
      adminEmail={user.email || ''}
    />
  )
}

