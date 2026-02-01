import { eq } from 'drizzle-orm'
import { db } from '../src/db'
import { authAccount, users } from '../src/db/schema'

async function clearAuthAccounts() {
  console.log('🧹 Clearing auth accounts...')

  const adminUser = await db.query.users.findFirst({
    where: eq(users.email, 'bradley@haveman.ca'),
  })

  const memberUser = await db.query.users.findFirst({
    where: eq(users.email, 'jenna@haveman.ca'),
  })

  if (adminUser) {
    await db.delete(authAccount).where(eq(authAccount.userId, adminUser.id))
    console.log('✅ Cleared admin auth account')
  }

  if (memberUser) {
    await db.delete(authAccount).where(eq(authAccount.userId, memberUser.id))
    console.log('✅ Cleared member auth account')
  }

  console.log('')
  console.log('Now use Better Auth API to set passwords:')
  console.log('Run this in your browser console at http://localhost:3001:')
  console.log('')
  console.log(`
// Set password for admin
await fetch('/api/auth/sign-up/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'bradley@haveman.ca',
    password: 'password123',
    name: 'Bradley Haveman'
  })
})

// Set password for member
await fetch('/api/auth/sign-up/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'jenna@haveman.ca',
    password: 'password123',
    name: 'Jenna Haveman'
  })
})
  `)
}

clearAuthAccounts()
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
