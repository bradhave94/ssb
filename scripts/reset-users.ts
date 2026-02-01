import { eq, or } from 'drizzle-orm'
import { db } from '../src/db'
import { authAccount, sessions, userRoles, users } from '../src/db/schema'

async function resetUsers() {
  console.log('🔄 Resetting user accounts...')

  // Delete Bradley and Jenna (but keep System user)
  const adminUser = await db.query.users.findFirst({
    where: eq(users.email, 'bradley@haveman.ca'),
  })

  const memberUser = await db.query.users.findFirst({
    where: eq(users.email, 'jenna@haveman.ca'),
  })

  if (adminUser) {
    // Delete related data
    await db.delete(authAccount).where(eq(authAccount.userId, adminUser.id))
    await db.delete(sessions).where(eq(sessions.userId, adminUser.id))
    await db.delete(userRoles).where(eq(userRoles.userId, adminUser.id))
    await db.delete(users).where(eq(users.id, adminUser.id))
    console.log('✅ Deleted bradley@haveman.ca')
  }

  if (memberUser) {
    // Delete related data
    await db.delete(authAccount).where(eq(authAccount.userId, memberUser.id))
    await db.delete(sessions).where(eq(sessions.userId, memberUser.id))
    await db.delete(userRoles).where(eq(userRoles.userId, memberUser.id))
    await db.delete(users).where(eq(users.id, memberUser.id))
    console.log('✅ Deleted jenna@haveman.ca')
  }

  console.log('')
  console.log('🎉 User accounts reset!')
  console.log('')
  console.log('Next steps:')
  console.log('1. Start dev server: bun run dev')
  console.log('2. Go to http://localhost:3000/signup')
  console.log('3. Create an admin account (first user)')
  console.log('4. Manually add role to userRoles table via Drizzle Studio')
  console.log('')
  console.log('Or use the signup page and I can help set the role after.')
}

resetUsers()
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
