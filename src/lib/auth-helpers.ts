import { auth } from './auth'
import type { Session, User } from 'better-auth/types'

export async function requireAuth(request: Request): Promise<{ user: User; session: Session }> {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  return { user: session.user, session: session.session }
}

export async function requireAdmin(request: Request): Promise<{ user: User; session: Session }> {
  const { user, session } = await requireAuth(request)

  // Check userRoles table for admin role
  const { db } = await import('@/db')
  const { userRoles } = await import('@/db/schema')
  const { eq } = await import('drizzle-orm')

  const userRole = await db.query.userRoles.findFirst({
    where: eq(userRoles.userId, user.id),
  })

  if (!userRole || userRole.role !== 'admin') {
    throw new Error('Forbidden - Admin access required')
  }

  return { user, session }
}

export async function getUserRole(userId: string): Promise<'admin' | 'member' | null> {
  const { db } = await import('@/db')
  const { userRoles } = await import('@/db/schema')
  const { eq } = await import('drizzle-orm')

  const userRole = await db.query.userRoles.findFirst({
    where: eq(userRoles.userId, userId),
  })

  return userRole?.role ?? null
}
