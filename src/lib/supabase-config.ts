export const isCatalogBackendEnabled = () => process.env.NEXT_PUBLIC_CATALOG_BACKEND === 'supabase-v1'

export const getPublicSupabaseConfig = () => {
  if (!isCatalogBackendEnabled()) {
    return { url: 'https://placeholder-project.supabase.co', key: 'placeholder-anon-key' }
  }
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
  }
}
