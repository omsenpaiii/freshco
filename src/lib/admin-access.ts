const ADMIN_EMAILS = [
  'agastyakapoorgk@gmail.com',
  'omtomar2004.ot@gmail.com',
] as const

export const ADMIN_EMAIL_SET = new Set(
  ADMIN_EMAILS.map((email) => email.trim().toLowerCase())
)

export function isAdminEmail(email?: string | null) {
  return !!email && ADMIN_EMAIL_SET.has(email.trim().toLowerCase())
}

